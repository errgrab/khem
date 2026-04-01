// src/compiler.js — Khem AST → { html, css, js }
import { parse } from "./core/parser.js";
import { VOID_ELEMENTS, BLOCK_TAGS, VAR_PATTERN, sanitizeId, jsStr, parseCSS } from "./shared.js";

// ─── Referências de variáveis ────────────────────────────────────────────────

// Converte $var ou var para referência JS.
// locals: Set (variáveis locais simples) ou Map (original → sanitizado)
function compileRef(name, locals) {
  const bare = name.startsWith("$") ? name.slice(1) : name;
  if (locals) {
    if (locals instanceof Map) { if (locals.has(bare)) return locals.get(bare); }
    else if (locals.has(bare)) return bare;
  }
  return `__s.${bare}`;
}

// Referência para atribuição (set target): sempre __s[key]
function compileSetRef(name, locals) {
  const bare = name.startsWith("$") ? name.slice(1) : name;
  if (locals) {
    if (locals instanceof Map) { if (locals.has(bare)) return `__s[${locals.get(bare)}]`; }
    else if (locals.has(bare)) return `__s[${bare}]`;
  }
  return `__s.${bare}`;
}

// ─── Substituição de variáveis em strings ────────────────────────────────────

// $var → Number(__s.var) — para expressões numéricas
function compileExpr(expr, locals) {
  return expr.replace(VAR_PATTERN, (_, n) => `Number(${compileRef(n, locals)})`);
}

// $var → "+__s.var+" — para concatenação em strings de conteúdo
function contentSub(s, locals) {
  return s
    .replace(/\x01([a-zA-Z_][a-zA-Z0-9_-]*)/g, (_, n) => `$${n}`) // escaped $
    .replace(VAR_PATTERN, (_, n) => `"+${compileRef(n, locals)}+"`)
    .replace(/\x02/g, "$");
}

// $var → __s.var — para referências soltas (args de proc, attr values)
function resolveArgSub(s, locals) {
  return s
    .replace(/\x01([a-zA-Z_][a-zA-Z0-9_-]*)/g, (_, n) => `$${n}`)
    .replace(VAR_PATTERN, (_, n) => compileRef(n, locals))
    .replace(/\x02/g, "$");
}

// ─── Compilação de conteúdo ──────────────────────────────────────────────────

// Compila uma parte de conteúdo (string ou array aninhado de [brackets])
// mode: "text" → retorna expressão JS de concatenação
//       "attr"  → retorna referência nua (sem aspas) se tem $var, senão quoted
function compileContentPart(arg, locals, procNames, mode = "text") {
  if (typeof arg === "string") {
    if (mode === "attr") {
      const resolved = resolveArgSub(arg, locals);
      return resolved === arg ? jsStr(arg) : resolved;
    }
    const subbed = contentSub(arg, locals);
    if (subbed === arg) return jsStr(arg);
    if (subbed.includes('"')) return jsStr(subbed);
    return `"${subbed}"`;
  }
  if (Array.isArray(arg)) {
    const cmd = Array.isArray(arg[0]) ? arg[0] : arg;
    if (cmd.length >= 1) {
      const fn = cmd[0];
      const fargs = cmd.slice(1).map(a =>
        typeof a === "string"
          ? (mode === "attr"
            ? (resolveArgSub(a, locals) === a ? jsStr(a) : resolveArgSub(a, locals))
            : compileContentPart(a, locals, procNames, mode))
          : compileContentPart(a, locals, procNames, mode)
      );
      return `${fn}(${fargs.join(", ")})`;
    }
    return jsStr(String(arg));
  }
  return jsStr(String(arg));
}

// ─── Compilação de set ───────────────────────────────────────────────────────

// Compila comando `set` para JS.
// ctx: "render" → dentro de função render (usa JSON.stringify no eval)
//      "event"  → dentro de onclick inline (escapamento diferente)
function compileSet(cmd, locals, out, ctx = "render") {
  const args = cmd.slice(1);
  const ref = compileSetRef(args[0] || "", locals);

  if (args[1] === "expr" && typeof args[2] === "string") {
    const e = compileExpr(args[2], locals);
    // Diferença principal: como o eval é representado como string
    const evalStr = ctx === "event"
      ? `"${e.replace(/"/g, '\\"')}"`
      : jsStr(e);
    out.push(`${ref}=String((function(){try{return eval(${evalStr})}catch{return 0}})())`);
  } else if (args[1] === "expr" && Array.isArray(args[2])) {
    // set $var expr [proc args]
    const bracket = args[2];
    if (bracket.length >= 1 && Array.isArray(bracket[0])) {
      const c = bracket[0];
      const fn = c[0];
      const fargs = c.slice(1).map(a =>
        typeof a === "string"
          ? (resolveArgSub(a, locals) === a ? jsStr(a) : resolveArgSub(a, locals))
          : compileContentPart(a, locals, null, "attr")
      );
      out.push(`${ref}=String((function(){try{return eval(${fn}(${fargs.join(", ")}))}catch{return 0}})())`);
    } else {
      out.push(`${ref}=String(${jsStr(String(bracket))})`);
    }
  } else {
    // set $var "literal"
    if (ctx === "event") {
      const val = String(args[1] ?? "").replace(/'/g, "\\'").replace(/"/g, '\\"');
      out.push(`${ref}=String("${val}")`);
    } else {
      out.push(`${ref}=${jsStr(args[1] ?? "")}`);
    }
  }
}

// ─── Event handlers ──────────────────────────────────────────────────────────

// Compila atributo de evento (onclick, oninput, etc) para string de atributo HTML
function compileEventAttr(cmd, locals) {
  const event = cmd[0] === "on" ? cmd[1] : cmd[0].slice(3);
  const body = cmd[0] === "on" ? cmd[2] : cmd[1];
  const bodyCmds = parse(typeof body === "string" ? body : "");
  const js = [];

  for (const c of bodyCmds) {
    if (!Array.isArray(c) || c.length === 0) continue;
    const cn = c[0];

    if (cn === "set") {
      compileSet(c, locals, js, "event");

    } else if (cn === "if") {
      compileIfInEvent(c, locals, js);

    } else if (typeof cn === "string") {
      // Proc call ou outro comando → function call
      const fargs = c.slice(1).map(a =>
        typeof a === "string" ? jsStr(a) : "String(" + compileContentPart(a, locals) + ")"
      );
      js.push(`${cn}(${fargs.join(", ")})`);
    }
  }

  js.push("__r()");
  return ` on${event}='${js.join(";")}'`;
}

// Compila if/else dentro de handler de evento (gera ternário ou &&)
function compileIfInEvent(cmd, locals, out) {
  const cond = typeof cmd[1] === "string"
    ? cmd[1].replace(VAR_PATTERN, (_, n) => compileRef(n, locals))
    : jsStr(cmd[1]);

  const compileBody = (body) => {
    const cmds = parse(typeof body === "string" ? body : "");
    const lines = [];
    for (const c of cmds) {
      if (Array.isArray(c) && c[0] === "set") compileSet(c, locals, lines, "event");
    }
    return lines;
  };

  if (cmd[4] === "else" && cmd[5]) {
    const trueJs = compileBody(cmd[3]);
    const falseJs = compileBody(cmd[5]);
    if (trueJs.length || falseJs.length) {
      out.push(`(${cond})?(${trueJs.join(";")}):(${falseJs.join(";")})`);
    }
  } else {
    const innerJs = compileBody(cmd[3]);
    if (innerJs.length) {
      out.push(`(${cond})&&(${innerJs.join(";")})`);
    }
  }
}

// ─── Atributos de elemento ──────────────────────────────────────────────────

// Extrai atributos e conteúdo do body de um elemento.
// Retorna { staticAttrs, dynamicAttrs, contentCmds }
function extractAttrs(body, locals) {
  const cmds = parse(typeof body === "string" ? body : "");
  let staticAttrs = "";
  const dynamicAttrs = [];
  const contentCmds = [];

  const KNOWN_ATTRS = new Set(["class", "id", "href", "src", "type", "value", "placeholder"]);

  for (const cmd of cmds) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    const n = cmd[0], a = cmd.slice(1);

    if (n === "on" || n.startsWith("on_")) {
      dynamicAttrs.push({ expr: compileEventAttr(cmd, locals) });

    } else if (KNOWN_ATTRS.has(n)) {
      const val = a[0];
      if (Array.isArray(val)) {
        dynamicAttrs.push({ name: n, expr: compileContentPart(val, locals, null, "attr") });
      } else {
        staticAttrs += ` ${n}=${jsStr(val ?? "")}`;
      }

    } else if (n === "data") {
      staticAttrs += ` data-${a[0] ?? ""}=${jsStr(a[1] ?? "")}`;

    } else if (n === "attr") {
      staticAttrs += ` ${a[0] ?? ""}=${jsStr(a[1] ?? "")}`;

    } else {
      contentCmds.push(cmd);
    }
  }

  return { staticAttrs, dynamicAttrs, contentCmds };
}

// ─── Compilação de elementos ─────────────────────────────────────────────────

// Compila elemento (tag + body) para expressão JS
function compileElement(tag, body, locals, procNames) {
  const { staticAttrs, dynamicAttrs, contentCmds } = extractAttrs(body, locals);
  const content = compileContentBody(contentCmds, locals, procNames);
  const openTag = `<${tag}${staticAttrs}>`;
  const closeTag = VOID_ELEMENTS.has(tag) ? "" : `</${tag}>`;

  // Sem atributos dinâmicos → string literal simples
  if (dynamicAttrs.length === 0) {
    if (VOID_ELEMENTS.has(tag)) return jsStr(openTag);
    return `${jsStr(openTag)} + ${content} + ${jsStr(closeTag)}`;
  }

  // Com atributos dinâmicos → interleave de strings e expressões
  const parts = [jsStr(`<${tag}${staticAttrs}`)];
  for (const da of dynamicAttrs) {
    if (da.name) {
      parts.push(jsStr(` ${da.name}="`));
      parts.push(da.expr);
      parts.push(jsStr('"'));
    } else {
      parts.push(jsStr(da.expr));
    }
  }
  parts.push(jsStr(">"));
  if (!VOID_ELEMENTS.has(tag)) {
    parts.push(` + ${content} + ${jsStr(closeTag)}`);
  }
  return parts.join(" + ");
}

// ─── Comando de conteúdo principal ───────────────────────────────────────────

// Compila um comando de conteúdo para expressão JS (ou null se é side-effect)
function compileOneContent(cmd, locals, procNames) {
  if (!Array.isArray(cmd) || cmd.length === 0) return null;
  const name = cmd[0], args = cmd.slice(1);

  switch (name) {
    case "text":
      return compileText(args, locals, procNames);

    case "elem":
      return compileElement(args[0] || "div", args[1] || "", locals, procNames);

    case "if":
      return compileIf(args, locals, procNames);

    case "for":
      return compileFor(args, locals, procNames);

    case "foreach":
      return compileForeach(args, locals, procNames);

    case "match":
      return compileMatch(args, locals, procNames);

    case "proc": case "set": case "on": case "state":
      return null; // side-effects, não geram conteúdo

    default:
      return compileDefault(name, args, locals, procNames);
  }
}

// text "hello $name" → expressão de concatenação
function compileText(args, locals, procNames) {
  const VAR_SPLIT = /(?=\$[a-zA-Z_][a-zA-Z0-9_-]*)/;
  const parts = args.flatMap(a => {
    if (typeof a === "string") {
      return a.split(VAR_SPLIT).map(seg => {
        if (!seg) return null;
        if (seg.startsWith("$")) return compileRef(seg, locals);
        return jsStr(seg);
      }).filter(Boolean);
    }
    return [compileContentPart(a, locals, procNames, "attr")];
  });
  return parts.length === 0 ? jsStr("") : parts.join(" + ");
}

// if $cond { body } else { elseBody } → ternário JS
function compileIf(args, locals, procNames) {
  const cond = typeof args[0] === "string" ? contentSub(args[0], locals) : jsStr(args[0]);
  const body = compileContentBody(args[2], locals, procNames);
  if (args[3] === "else" && args[4]) {
    const elseBody = compileContentBody(args[4], locals, procNames);
    return `((${cond}) ? (${body}) : (${elseBody}))`;
  }
  return `((${cond}) ? (${body}) : (""))`;
}

// for var start end { body } → IIFE com for loop
function compileFor(args, locals, procNames) {
  const v = args[0] || "i";
  const s = typeof args[1] === "string" ? contentSub(args[1], locals) : jsStr(args[1]);
  const e = typeof args[2] === "string" ? contentSub(args[2], locals) : jsStr(args[2]);
  const forLocals = new Set(locals);
  forLocals.add(v);
  const b = compileContentBody(args[3], forLocals, procNames);
  return `(function(){var __r="";for(var ${v}=Number(${s});${v}<=Number(${e});${v}++){__r+=${b}}return __r})()`;
}

// foreach var list { body } → IIFE com forEach
function compileForeach(args, locals, procNames) {
  const v = args[0] || "v";
  const l = typeof args[1] === "string" ? contentSub(args[1], locals) : jsStr(args[1]);
  const feLocals = new Set(locals);
  feLocals.add(v);
  const b = compileContentBody(args[2], feLocals, procNames);
  return `(function(){var __r="";(${l}).split(" ").forEach(function(${v}){__r+=${b}});return __r})()`;
}

// match $expr { val1 { body1 } val2 { body2 } default { fallback } }
function compileMatch(args, locals, procNames) {
  const expr = typeof args[0] === "string" ? compileExpr(args[0], locals) : jsStr(args[0]);
  const arms = parse(args[1] || "");
  let result = '""';
  for (let i = arms.length - 1; i >= 0; i--) {
    const arm = arms[i];
    if (!Array.isArray(arm) || arm.length < 2) continue;
    const compiled = compileContentBody(arm[1], locals, procNames);
    if (arm[0] === "default") {
      result = compiled;
    } else {
      result = `((${expr} == ${arm[0]}) ? (${compiled}) : (${result}))`;
    }
  }
  return `(${result})`;
}

// Comando desconhecido → tenta como block tag shorthand ou proc call
function compileDefault(name, args, locals, procNames) {
  if (BLOCK_TAGS.has(name)) return compileElement(name, args[0] || "", locals, procNames);
  if (name === "br" || name === "hr") return jsStr(`<${name}>`);
  if (name === "img") return jsStr(`<img src=${jsStr(args[0] ?? "")} alt=${jsStr(args[1] ?? "")}>`);
  if (procNames && procNames.has(name)) {
    const fargs = args.map(a =>
      typeof a === "string"
        ? (a.includes("$") ? resolveArgSub(a, locals) : jsStr(a))
        : compileContentPart(a, locals, procNames, "attr")
    );
    return `${name}(${fargs.join(", ")})`;
  }
  return null;
}

// ─── Helpers de body ─────────────────────────────────────────────────────────

// Compila lista de comandos para expressão JS de concatenação
function compileContentBody(body, locals, procNames) {
  const cmds = typeof body === "string" ? parse(body) : body;
  const parts = [];
  for (const cmd of cmds) {
    const r = compileOneContent(cmd, locals, procNames);
    if (r !== null) parts.push(r);
  }
  return parts.length === 0 ? '""' : parts.join(" + ");
}

// Compila body de proc (pode misturar set + conteúdo → IIFE)
function compileProcBody(body, locals, procNames) {
  const cmds = typeof body === "string" ? parse(body) : body;
  const stmts = [];
  const contents = [];
  let hasSideEffect = false;

  for (const cmd of cmds) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    if (cmd[0] === "set") { hasSideEffect = true; compileSet(cmd, locals, stmts); }
    else { const r = compileOneContent(cmd, locals, procNames); if (r !== null) contents.push(r); }
  }

  if (!hasSideEffect) return contents.length === 0 ? '""' : contents.join(" + ");

  const lines = ["(function(){var __r='';"];
  for (const s of stmts) lines.push(s + ";");
  for (const c of contents) lines.push("__r+=" + c + ";");
  lines.push("return __r})()");
  return lines.join("");
}

// ─── Main compile ────────────────────────────────────────────────────────────

export function compile(ast, env) {
  const state = {};
  const cssBlocks = [];
  const procFuncs = [];
  const renderCmds = [];

  // Classifica comandos por tipo
  for (const cmd of ast) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    const n = cmd[0];
    if (n === "state") state[cmd[1]] = cmd[2] ?? "";
    else if (n === "style") cssBlocks.push(parseCSS(cmd[1] || ""));
    else if (n === "proc") procFuncs.push(cmd);
    else renderCmds.push(cmd);
  }

  // Compila procs
  const procNames = new Set(procFuncs.map(c => c[1]));
  const procJS = procFuncs.map(cmd => {
    const name = cmd[1];
    const rawParams = cmd[2] || "";
    const body = cmd[3];
    const locals = new Map();
    const params = rawParams.split(/[;\s]+/).filter(Boolean).map(p => {
      const s = sanitizeId(p);
      locals.set(p, s);
      return s;
    });
    return `function ${name}(${params.join(", ")}){return ${compileProcBody(body, locals, procNames)}}`;
  });

  // Separa sets de inicialização do conteúdo de render
  const initSets = renderCmds.filter(c => Array.isArray(c) && c[0] === "set");
  const renderBody = renderCmds.filter(c => !(Array.isArray(c) && c[0] === "set"));

  // Aplica sets de inicialização ao state
  for (const cmd of initSets) {
    const args = cmd.slice(1);
    const key = args[0] || "";
    state[key] = (args[1] === "expr" && typeof args[2] === "string") ? args[2] : (args[1] ?? "");
  }

  // Compila body de render
  const locals = new Set();
  const renderExprs = renderBody
    .map(cmd => compileOneContent(cmd, locals, procNames))
    .filter(r => r !== null);

  const renderJS = renderExprs.length === 0
    ? 'function render(){return ""}'
    : `function render(){return ${renderExprs.join(" + ")}}`;

  // Monta JS final
  const jsParts = [];

  if (Object.keys(state).length > 0)
    jsParts.push(`var __s=${JSON.stringify(state)};`);

  if (procJS.length) jsParts.push(procJS.join("\n"));

  jsParts.push(renderJS);
  jsParts.push(
    `function __diff(a,b){` +
    `if(!a||!b)return;` +
    `if(a.nodeType===3){if(a.textContent!==b.textContent)a.textContent=b.textContent;return;}` +
    `if(a.tagName!==b.tagName){a.parentNode.replaceChild(b.cloneNode(true),a);return;}` +
    `var i;for(i=0;i<b.attributes.length;i++)a.setAttribute(b.attributes[i].name,b.attributes[i].value);` +
    `var ac=Array.from(a.childNodes),bc=Array.from(b.childNodes);` +
    `for(i=0;i<Math.max(ac.length,bc.length);i++){` +
    `if(i>=ac.length)a.appendChild(bc[i].cloneNode(true));` +
    `else if(i>=bc.length)a.removeChild(ac[i]);` +
    `else __diff(ac[i],bc[i]);}}`
  );
  jsParts.push(`function __r(){var t=document.createElement('div');t.innerHTML=render();__diff(document.getElementById('app'),t);}`);
  jsParts.push(`document.getElementById('app').innerHTML=render();`);

  return { html: "", css: cssBlocks.join("\n"), js: jsParts.join("\n") };
}
