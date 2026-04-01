// src/compiler.js — Khem AST → { html, css, js }
import { parse } from "./core/parser.js";

const JS_RESERVED = new Set([
  "break","case","catch","continue","debugger","default","delete","do","else",
  "finally","for","function","if","in","instanceof","new","return","switch",
  "throw","try","typeof","var","void","while","with","class","const","enum",
  "export","extends","import","super","implements","interface","let","package",
  "private","protected","public","static","yield","await","async",
]);

function sanitizeId(name) {
  return JS_RESERVED.has(name) ? "_" + name : name;
}

function jsStr(s) {
  return JSON.stringify(String(s));
}

// Convert $var: global → __s.x, local → sanitized local name
// locals can be a Set or Map (Map maps original→sanitized)
function compileRef(name, locals) {
  const bare = name.startsWith("$") ? name.slice(1) : name;
  if (locals) {
    if (locals instanceof Map) { if (locals.has(bare)) return locals.get(bare); }
    else if (locals.has(bare)) return bare;
  }
  return `__s.${bare}`;
}

// Compile ref for set target: always __s[key], resolving local name if needed
function compileSetRef(name, locals) {
  const bare = name.startsWith("$") ? name.slice(1) : name;
  if (locals) {
    if (locals instanceof Map) { if (locals.has(bare)) return `__s[${locals.get(bare)}]`; }
    else if (locals.has(bare)) return `__s[${bare}]`;
  }
  return `__s.${bare}`;
}

// Replace $var in expr string (numeric)
function compileExpr(expr, locals) {
  return expr.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g, (_, n) =>
    `Number(${compileRef(n, locals)})`);
}

// Replace $var in content string → JS concat expression
function contentSub(s, locals) {
  return s
    .replace(/\x01([a-zA-Z_][a-zA-Z0-9_-]*)/g, (_, n) => `$${n}`) // escaped $
    .replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g, (_, n) => `"+${compileRef(n, locals)}+"`)
    .replace(/\x02/g, "$");
}

// Resolve $var in arg strings to bare references (no concat wrapping)
// Used for proc call args and attribute values
function resolveArgSub(s, locals) {
  return s
    .replace(/\x01([a-zA-Z_][a-zA-Z0-9_-]*)/g, (_, n) => `$${n}`)
    .replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g, (_, n) => compileRef(n, locals))
    .replace(/\x02/g, "$");
}

// Compile a single content part — string or nested array (from [brackets])
// If noQuote is true, return bare references (for proc args/attr values)
function compileContentPart(arg, locals, procNames, noQuote) {
  if (typeof arg === "string") {
    if (noQuote) {
      const resolved = resolveArgSub(arg, locals);
      return resolved === arg ? jsStr(arg) : resolved;
    }
    const subbed = contentSub(arg, locals);
    if (subbed === arg) return jsStr(arg);
    // Use JSON.stringify if subbed contains quotes (would break simple wrapping)
    if (subbed.includes('"')) return jsStr(subbed);
    return `"${subbed}"`;
  }
  if (Array.isArray(arg)) {
    // Nested command substitution (from bracket in text) or direct proc call array
    let cmd;
    if (arg.length >= 1 && Array.isArray(arg[0])) {
      cmd = arg[0]; // [["fn", args...]] → ["fn", args...]
    } else {
      cmd = arg; // ["fn", args...] directly
    }
    if (cmd.length >= 1) {
      const fn = cmd[0];
      const fargs = cmd.slice(1).map(a => {
        if (typeof a === "string") {
          if (noQuote) {
            const resolved = resolveArgSub(a, locals);
            return resolved === a ? jsStr(a) : resolved;
          }
          const sub = contentSub(a, locals);
          if (sub === a) return jsStr(a);
          if (sub.includes('"')) return jsStr(sub);
          return `"${sub}"`;
        }
        return compileContentPart(a, locals, procNames, noQuote);
      });
      return `${fn}(${fargs.join(", ")})`;
    }
    return jsStr(String(arg));
  }
  return jsStr(String(arg));
}

// Compile set command to JS statement (for render function)
function compileSetStmt(cmd, locals, out) {
  const args = cmd.slice(1);
  const ref = compileSetRef(args[0] || "", locals);
  if (args[1] === "expr" && typeof args[2] === "string") {
    const e = compileExpr(args[2], locals);
    out.push(`${ref}=String((function(){try{return eval(${jsStr(e)})}catch{return 0}})())`);
  } else {
    out.push(`${ref}=${jsStr(args[1] ?? "")}`);
  }
}

// Compile set command for event handler (plain string, no JSON.stringify on eval)
function compileSetHandler(cmd, locals, out) {
  const args = cmd.slice(1);
  const ref = compileSetRef(args[0] || "", locals);
  if (args[1] === "expr" && typeof args[2] === "string") {
    const e = compileExpr(args[2], locals);
    out.push(`${ref}=String((function(){try{return eval("${e.replace(/"/g, '\\"')}")}catch{return 0}})())`);
  } else if (args[1] === "expr" && Array.isArray(args[2])) {
    // expr with bracket proc call: set $var expr [proc args]
    const bracket = args[2];
    if (bracket.length >= 1 && Array.isArray(bracket[0])) {
      const c = bracket[0];
      const fn = c[0];
      const fargs = c.slice(1).map(a => {
        if (typeof a === "string") {
          const resolved = resolveArgSub(a, locals);
          return resolved === a ? jsStr(a) : resolved;
        }
        return compileContentPart(a, locals, null, true);
      });
      // fn returns an expression string — eval it
      out.push(`${ref}=String((function(){try{return eval(${fn}(${fargs.join(", ")}))}catch{return 0}})())`);
    } else {
      out.push(`${ref}=String(${jsStr(String(bracket))})`);
    }
  } else {
    // Use String() wrapper to avoid quote conflicts in onclick handler
    const val = String(args[1] ?? "").replace(/'/g, "\\'").replace(/"/g, '\\"');
    out.push(`${ref}=String("${val}")`);
  }
}

// Compile event handler attribute
function compileEventAttr(cmd, locals) {
  let event, body;
  if (cmd[0] === "on") { event = cmd[1]; body = cmd[2]; }
  else { event = cmd[0].slice(3); body = cmd[1]; }
  const bodyCmds = parse(typeof body === "string" ? body : "");
  const js = [];
  for (const c of bodyCmds) {
    if (!Array.isArray(c) || c.length === 0) continue;
    const cn = c[0];
    if (cn === "set") {
      compileSetHandler(c, locals, js);
    } else if (cn === "if") {
      // Compile if statement — use compileRef for variable lookup
      // c = ["if", cond, value, body, "else", elseBody]
      const cond = typeof c[1] === "string"
        ? c[1].replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g, (_, n) => compileRef(n, locals))
        : jsStr(c[1]);
      if (c[4] === "else" && c[5]) {
        // if/else → ternary
        const trueBody = parse(typeof c[3] === "string" ? c[3] : "");
        const trueJs = [];
        for (const tc of trueBody) {
          if (Array.isArray(tc) && tc[0] === "set") compileSetHandler(tc, locals, trueJs);
        }
        const falseBody = parse(typeof c[5] === "string" ? c[5] : "");
        const falseJs = [];
        for (const fc of falseBody) {
          if (Array.isArray(fc) && fc[0] === "set") compileSetHandler(fc, locals, falseJs);
        }
        if (trueJs.length || falseJs.length) {
          js.push(`(${cond})?(${trueJs.join(";")}):(${falseJs.join(";")})`);
        }
      } else {
        // Simple if (no else)
        const innerBody = parse(typeof c[3] === "string" ? c[3] : "");
        const innerJs = [];
        for (const ic of innerBody) {
          if (Array.isArray(ic) && ic[0] === "set") compileSetHandler(ic, locals, innerJs);
        }
        if (innerJs.length) {
          js.push(`(${cond})&&(${innerJs.join(";")})`);
        }
      }
    } else if (typeof cn === "string") {
      // Proc call or other command → compile as function call
      const fargs = c.slice(1).map(a =>
        typeof a === "string" ? jsStr(a) : "String(" + compileContentPart(a, locals) + ")"
      );
      js.push(`${cn}(${fargs.join(", ")})`);
    }
  }
  js.push("__r()");
  return ` on${event}='${js.join(";")}'`;
}

// Build attribute string for an element from its body commands
// Returns { attrStr, contentCmds } where attrStr is like ' class="app" id="x"'
function extractAttrs(body, locals) {
  const cmds = parse(typeof body === "string" ? body : "");
  let staticAttrs = "";
  let dynamicAttrs = []; // array of JS expressions for dynamic parts
  const contentCmds = [];
  for (const cmd of cmds) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    const n = cmd[0], a = cmd.slice(1);
    if (n === "on" || n.startsWith("on_")) {
      dynamicAttrs.push({ expr: compileEventAttr(cmd, locals) });
    } else if (["class","id","href","src","type","value","placeholder"].includes(n)) {
      const val = a[0];
      if (Array.isArray(val)) {
        // Dynamic attribute — store attr name and expression
        const expr = compileContentPart(val, locals, null, true);
        dynamicAttrs.push({ name: n, expr });
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

// Compile list of content commands to JS expression
function compileContentCmds(cmds, locals, procNames) {
  const parts = [];
  for (const cmd of cmds) {
    const r = compileOneContent(cmd, locals, procNames);
    if (r !== null) parts.push(r);
  }
  return parts.length === 0 ? '""' : parts.join(" + ");
}

// Compile element (tag + body) to JS expression
function compileElement(tag, body, locals, procNames) {
  const { staticAttrs, dynamicAttrs, contentCmds } = extractAttrs(body, locals);
  const content = compileContentCmds(contentCmds, locals, procNames);
  const voids = new Set(["br","hr","img","input","meta","link","area","base","col","embed","source","track","wbr"]);
  const openTag = `<${tag}${staticAttrs}>`;
  const closeTag = voids.has(tag) ? "" : `</${tag}>`;
  if (dynamicAttrs.length === 0) {
    if (voids.has(tag)) return jsStr(openTag);
    return jsStr(openTag) + " + " + content + " + " + jsStr(closeTag);
  }
  // Has dynamic attrs: interleave static string with dynamic expressions
  const parts = [jsStr(`<${tag}${staticAttrs}`)];
  for (const da of dynamicAttrs) {
    if (da.name) {
      parts.push(jsStr(` ${da.name}="`));
      parts.push(da.expr);
      parts.push(jsStr('"'));
    } else {
      // Event handler or full attr string — already a complete attribute string
      parts.push(jsStr(da.expr));
    }
  }
  parts.push(jsStr('>')); // close the opening tag
  if (!voids.has(tag)) {
    parts.push(" + " + content + " + " + jsStr(closeTag));
  }
  return parts.join(" + ");
}

// Compile one content command to JS expression (or null)
function compileOneContent(cmd, locals, procNames) {
  if (!Array.isArray(cmd) || cmd.length === 0) return null;
  const name = cmd[0], args = cmd.slice(1);

  switch (name) {
    case "text": {
      // Handle multiple args (text "prefix" [proc] "suffix")
      // Text needs static strings quoted and dynamic vars as expressions
      const parts = args.flatMap(a => {
        if (typeof a === "string") {
          // Split into static and dynamic parts
          const segments = a.split(/(\$[a-zA-Z_][a-zA-Z0-9_-]*)/);
          return segments.map(seg => {
            if (!seg) return null; // empty
            if (seg.startsWith("$")) {
              // Variable reference — return as expression
              return compileRef(seg, locals);
            }
            // Static text — return as quoted string
            return jsStr(seg);
          }).filter(Boolean);
        }
        // Array arg (proc call) — compile as expression
        return [compileContentPart(a, locals, procNames, true)];
      });
      return parts.length === 0 ? jsStr("") : parts.join(" + ");
    }
    case "elem":
      return compileElement(args[0] || "div", args[1] || "", locals, procNames);
    case "if": {
      const cond = typeof args[0] === "string" ? contentSub(args[0], locals) : jsStr(args[0]);
      const body = compileContentBody(args[2], locals, procNames);
      if (args[3] === "else" && args[4]) {
        const elseBody = compileContentBody(args[4], locals, procNames);
        return `((${cond}) ? (${body}) : (${elseBody}))`;
      }
      return `((${cond}) ? (${body}) : (""))`;
    }
    case "for": {
      const v = args[0] || "i";
      const s = typeof args[1] === "string" ? contentSub(args[1], locals) : jsStr(args[1]);
      const e = typeof args[2] === "string" ? contentSub(args[2], locals) : jsStr(args[2]);
      const forLocals = new Set(locals);
      forLocals.add(v);
      const b = compileContentBody(args[3], forLocals, procNames);
      return `(function(){var __r="";for(var ${v}=Number(${s});${v}<=Number(${e});${v}++){__r+=${b}}return __r})()`;
    }
    case "foreach": {
      const v = args[0] || "v";
      const l = typeof args[1] === "string" ? contentSub(args[1], locals) : jsStr(args[1]);
      const feLocals = new Set(locals);
      feLocals.add(v);
      const b = compileContentBody(args[2], feLocals, procNames);
      return `(function(){var __r="";(${l}).split(" ").forEach(function(${v}){__r+=${b}});return __r})()`;
    }
    case "match": {
      const expr = typeof args[0] === "string"
        ? compileExpr(args[0], locals)
        : jsStr(args[0]);
      const arms = parse(args[1] || "");
      let result = '""'; // default fallback
      for (let i = arms.length - 1; i >= 0; i--) {
        const arm = arms[i];
        if (!Array.isArray(arm) || arm.length < 2) continue;
        const val = arm[0]; // "76" or "default"
        const armBody = arm[1]; // body string
        const compiled = compileContentBody(armBody, locals, procNames);
        if (val === "default") {
          result = compiled;
        } else {
          const cond = `(${expr} == ${val})`;
          result = `(${cond}) ? (${compiled}) : (${result})`;
        }
      }
      return `(${result})`;
    }
    case "proc": case "set": case "on": case "state":
      return null;
    default: {
      // Block tag shorthand: div { ... } → same as elem "div" { ... }
      const blockTags = new Set([
        "div","span","p","h1","h2","h3","h4","h5","h6",
        "ul","ol","li","table","tr","td","th",
        "section","main","header","footer","nav","article",
        "form","pre","code","blockquote","strong","em","button","input","a",
      ]);
      if (blockTags.has(name)) return compileElement(name, args[0] || "", locals, procNames);
      if (name === "br" || name === "hr") return jsStr(`<${name}>`);
      if (name === "img") return jsStr(`<img src=${jsStr(args[0] ?? "")} alt=${jsStr(args[1] ?? "")}>`);
      // Proc call: compile as function call
      if (procNames && procNames.has(name)) {
        const fargs = args.map(a => {
          if (typeof a === "string") {
            // Resolve $var refs in proc args to bare references
            if (a.includes("$")) {
              const resolved = resolveArgSub(a, locals);
              return resolved === a ? jsStr(a) : resolved;
            }
            return jsStr(a);
          }
          return compileContentPart(a, locals, procNames, true);
        });
        return `${name}(${fargs.join(", ")})`;
      }
      return null;
    }
  }
}

// Compile body string to content-only JS expression
function compileContentBody(body, locals, procNames) {
  const cmds = typeof body === "string" ? parse(body) : body;
  return compileContentCmds(cmds, locals, procNames);
}

// Compile body to JS statements (for render function with possible set/on mixed in)
function compileBodyToStmts(body, locals, procNames) {
  const cmds = typeof body === "string" ? parse(body) : body;
  const stmts = [];
  const contents = [];
  let hasSideEffect = false;
  for (const cmd of cmds) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    if (cmd[0] === "set") { hasSideEffect = true; compileSetStmt(cmd, locals, stmts); }
    else if (cmd[0] === "on") { hasSideEffect = true; /* skip event in render */ }
    else { const r = compileOneContent(cmd, locals, procNames); if (r !== null) contents.push(r); }
  }
  if (!hasSideEffect) {
    if (contents.length === 0) return ["__r+='';"];
    return ["__r+=" + contents.join(" + ") + ";"];
  }
  for (const c of contents) stmts.push("__r+=" + c + ";");
  return stmts;
}

// Compile proc body (may mix set + content → IIFE)
function compileProcBody(body, locals, procNames) {
  const cmds = typeof body === "string" ? parse(body) : body;
  const stmts = [];
  const contents = [];
  let hasSideEffect = false;
  for (const cmd of cmds) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    if (cmd[0] === "set") { hasSideEffect = true; compileSetStmt(cmd, locals, stmts); }
    else { const r = compileOneContent(cmd, locals, procNames); if (r !== null) contents.push(r); }
  }
  if (!hasSideEffect) return contents.length === 0 ? '""' : contents.join(" + ");
  // IIFE for mixed body
  const lines = ["(function(){var __r='';"];
  for (const s of stmts) lines.push(s + ";");
  for (const c of contents) lines.push("__r+=" + c + ";");
  lines.push("return __r})()");
  return lines.join("");
}

// --- Main compile ---

export function compile(ast, env) {
  const state = {};
  const cssBlocks = [];
  const procFuncs = [];
  const renderCmds = [];

  for (const cmd of ast) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    const n = cmd[0];
    if (n === "state") state[cmd[1]] = cmd[2] ?? "";
    else if (n === "style") cssBlocks.push(cmd[1] || "");
    else if (n === "proc") procFuncs.push(cmd);
    else renderCmds.push(cmd);
  }

  // Compile procs
  const procNames = new Set(procFuncs.map(c => c[1]));
  const procJS = [];
  for (const cmd of procFuncs) {
    const name = cmd[1];
    const rawParams = cmd[2] || "";
    const body = cmd[3];
    // Split params by ; or whitespace
    const rawParamsList = rawParams.split(/[;\s]+/).filter(Boolean);
    // Sanitize param names (e.g. "var" → "_var")
    const locals = new Map();
    const params = rawParamsList.map(p => { const s = sanitizeId(p); locals.set(p, s); return s; });
    procJS.push(`function ${name}(${params.join(", ")}){return ${compileProcBody(body, locals, procNames)}}`);
  }

  // Separate top-level set commands (init) from render content
  const initSets = [];
  const renderBody = [];
  for (const cmd of renderCmds) {
    if (Array.isArray(cmd) && cmd[0] === "set") initSets.push(cmd);
    else renderBody.push(cmd);
  }

  // Apply top-level set to state initialization
  for (const cmd of initSets) {
    const args = cmd.slice(1);
    const key = args[0] || "";
    if (args[1] === "expr" && typeof args[2] === "string") {
      // For init expr, evaluate at compile time if possible, otherwise store as-is
      state[key] = args[2];
    } else {
      state[key] = args[1] ?? "";
    }
  }

  // Compile render body (no set commands)
  const locals = new Set();
  const renderStmts = [];
  for (const cmd of renderBody) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    const expr = compileOneContent(cmd, locals, procNames);
    if (expr !== null) {
      renderStmts.push(expr);
    }
  }

  // Build render function
  let renderJS;
  if (renderStmts.length === 0) {
    renderJS = 'function render(){return ""}';
  } else {
    // All entries are content expressions (strings starting with ")
    renderJS = `function render(){return ${renderStmts.join(" + ")}}`;
  }

  // Assemble JS
  const jsParts = [];
  if (Object.keys(state).length > 0)
    jsParts.push(`var __s=${JSON.stringify(state)};`);
  if (procJS.length) jsParts.push(procJS.join("\n"));
  jsParts.push(renderJS);
  jsParts.push(`function __diff(a,b){if(!a||!b)return;if(a.nodeType===3){if(a.textContent!==b.textContent)a.textContent=b.textContent;return;}if(a.tagName!==b.tagName){a.parentNode.replaceChild(b.cloneNode(true),a);return;}var i;for(i=0;i<b.attributes.length;i++)a.setAttribute(b.attributes[i].name,b.attributes[i].value);var ac=Array.from(a.childNodes),bc=Array.from(b.childNodes);for(i=0;i<Math.max(ac.length,bc.length);i++){if(i>=ac.length)a.appendChild(bc[i].cloneNode(true));else if(i>=bc.length)a.removeChild(ac[i]);else __diff(ac[i],bc[i]);}}`);
  jsParts.push(`function __r(){var t=document.createElement('div');t.innerHTML=render();__diff(document.getElementById('app'),t);}`);
  jsParts.push(`document.getElementById('app').innerHTML=render();`);

  return {
    html: "",
    css: cssBlocks.join("\n"),
    js: jsParts.join("\n"),
  };
}
