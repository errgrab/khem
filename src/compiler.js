import Khem from "./khem.js";
import { VOID_ELEMENTS, BLOCK_TAGS, VAR_PATTERN, sanitizeId, jsStr, parseCSS } from "./shared.js";

const parse = Khem.Parser.lex;

const ATTR_CMDS = new Set(["class", "id", "href", "src", "type", "value", "placeholder"]);
const SIDE_EFFECTS = new Set(["proc", "set", "on", "state", "style"]);

// ─── Compiler ────────────────────────────────────────────────────────────────

class Compiler {
  constructor(ast) {
    this.ast = ast;
    this.state = {};
    this.cssBlocks = [];
    this.procs = [];
    this.renderCmds = [];
    this.procNames = new Set();
  }

  // ── Variable references ──

  ref(name, locals) {
    const bare = name.startsWith("$") ? name.slice(1) : name;
    if (locals instanceof Map && locals.has(bare)) return locals.get(bare);
    if (locals instanceof Set && locals.has(bare)) return bare;
    return `__s.${bare}`;
  }

  // $var → Number(__s.var) for numeric expressions
  exprSub(s, locals) {
    return s.replace(VAR_PATTERN, (_, n) => `Number(${this.ref(n, locals)})`);
  }

  // $var → "+__s.var+" for string content concatenation
  contentSub(s, locals) {
    return s
      .replace(/\x01([a-zA-Z_][a-zA-Z0-9_-]*)/g, (_, n) => `$${n}`)
      .replace(VAR_PATTERN, (_, n) => `"+${this.ref(n, locals)}+"`)
      .replace(/\x02/g, "$");
  }

  // $var → __s.var for bare references (proc args, attr values)
  argSub(s, locals) {
    return s
      .replace(/\x01([a-zA-Z_][a-zA-Z0-9_-]*)/g, (_, n) => `$${n}`)
      .replace(VAR_PATTERN, (_, n) => this.ref(n, locals))
      .replace(/\x02/g, "$");
  }

  // ── Content parts ──

  compilePart(arg, locals, mode = "text") {
    if (typeof arg === "string") {
      if (mode === "attr") {
        const resolved = this.argSub(arg, locals);
        return resolved === arg ? jsStr(arg) : resolved;
      }
      const subbed = this.contentSub(arg, locals);
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
              ? (this.argSub(a, locals) === a ? jsStr(a) : this.argSub(a, locals))
              : this.compilePart(a, locals, mode))
            : this.compilePart(a, locals, mode)
        );
        return `${fn}(${fargs.join(", ")})`;
      }
      return jsStr(String(arg));
    }
    return jsStr(String(arg));
  }

  // ── Set command ──

  compileSet(cmd, locals, out, ctx = "render") {
    const args = cmd.slice(1);
    const bare = (args[0] || "").startsWith("$") ? args[0].slice(1) : (args[0] || "");
    const ref = locals instanceof Map && locals.has(bare)
      ? `__s[${locals.get(bare)}]`
      : `__s.${bare}`;

    if (args[1] === "expr" && typeof args[2] === "string") {
      const e = this.exprSub(args[2], locals);
      const evalStr = ctx === "event"
        ? `"${e.replace(/"/g, '\\"')}"`
        : jsStr(e);
      out.push(`${ref}=String((function(){try{return eval(${evalStr})}catch{return 0}})())`);
    } else if (args[1] === "expr" && Array.isArray(args[2])) {
      const bracket = args[2];
      if (bracket.length >= 1 && Array.isArray(bracket[0])) {
        const c = bracket[0];
        const fn = c[0];
        const fargs = c.slice(1).map(a =>
          typeof a === "string"
            ? (this.argSub(a, locals) === a ? jsStr(a) : this.argSub(a, locals))
            : this.compilePart(a, locals, "attr")
        );
        out.push(`${ref}=String((function(){try{return eval(${fn}(${fargs.join(", ")}))}catch{return 0}})())`);
      } else {
        out.push(`${ref}=String(${jsStr(String(bracket))})`);
      }
    } else {
      if (ctx === "event") {
        const val = String(args[1] ?? "").replace(/'/g, "\\'").replace(/"/g, '\\"');
        out.push(`${ref}=String("${val}")`);
      } else {
        out.push(`${ref}=${jsStr(args[1] ?? "")}`);
      }
    }
  }

  // ── Event handlers ──

  compileEvent(cmd, locals) {
    const event = cmd[0] === "on" ? cmd[1] : cmd[0].slice(3);
    const body = cmd[0] === "on" ? cmd[2] : cmd[1];
    const bodyCmds = parse(typeof body === "string" ? body : "");
    const lines = [];

    for (const c of bodyCmds) {
      if (!Array.isArray(c) || c.length === 0) continue;
      const cn = c[0];

      if (cn === "set") {
        this.compileSet(c, locals, lines, "event");
      } else if (cn === "if") {
        this.compileIfEvent(c, locals, lines);
      } else if (typeof cn === "string") {
        const fargs = c.slice(1).map(a =>
          typeof a === "string" ? jsStr(a) : "String(" + this.compilePart(a, locals) + ")"
        );
        lines.push(`${cn}(${fargs.join(", ")})`);
      }
    }

    lines.push("__r()");
    return ` on${event}='${lines.join(";")}'`;
  }

  compileIfEvent(cmd, locals, out) {
    const cond = typeof cmd[1] === "string"
      ? cmd[1].replace(VAR_PATTERN, (_, n) => this.ref(n, locals))
      : jsStr(cmd[1]);

    const body = (block) => {
      const cmds = parse(typeof block === "string" ? block : "");
      const lines = [];
      for (const c of cmds) {
        if (Array.isArray(c) && c[0] === "set") this.compileSet(c, locals, lines, "event");
      }
      return lines;
    };

    if (cmd[4] === "else" && cmd[5]) {
      const t = body(cmd[3]), f = body(cmd[5]);
      if (t.length || f.length) out.push(`(${cond})?(${t.join(";")}):(${f.join(";")})`);
    } else {
      const inner = body(cmd[3]);
      if (inner.length) out.push(`(${cond})&&(${inner.join(";")})`);
    }
  }

  // ── Elements ──

  extractAttrs(body, locals) {
    const cmds = parse(typeof body === "string" ? body : "");
    let staticAttrs = "";
    const dynamicAttrs = [];
    const contentCmds = [];

    for (const cmd of cmds) {
      if (!Array.isArray(cmd) || cmd.length === 0) continue;
      const n = cmd[0], a = cmd.slice(1);

      if (n === "on" || n.startsWith("on_")) {
        dynamicAttrs.push({ expr: this.compileEvent(cmd, locals) });
      } else if (ATTR_CMDS.has(n)) {
        const val = a[0];
        if (Array.isArray(val)) {
          dynamicAttrs.push({ name: n, expr: this.compilePart(val, locals, "attr") });
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

  compileElement(tag, body, locals) {
    const { staticAttrs, dynamicAttrs, contentCmds } = this.extractAttrs(body, locals);
    const content = this.compileBody(contentCmds, locals);
    const open = `<${tag}${staticAttrs}>`;
    const close = VOID_ELEMENTS.has(tag) ? "" : `</${tag}>`;

    if (dynamicAttrs.length === 0) {
      if (VOID_ELEMENTS.has(tag)) return jsStr(open);
      return `${jsStr(open)} + ${content} + ${jsStr(close)}`;
    }

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
      parts.push(` + ${content} + ${jsStr(close)}`);
    }
    return parts.join(" + ");
  }

  // ── Control flow ──

  compileIf(args, locals) {
    const cond = typeof args[0] === "string" ? this.contentSub(args[0], locals) : jsStr(args[0]);
    const body = this.compileBody(args[2], locals);
    if (args[3] === "else" && args[4]) {
      const elseBody = this.compileBody(args[4], locals);
      return `((${cond}) ? (${body}) : (${elseBody}))`;
    }
    return `((${cond}) ? (${body}) : (""))`;
  }

  compileFor(args, locals) {
    const v = args[0] || "i";
    const s = typeof args[1] === "string" ? this.contentSub(args[1], locals) : jsStr(args[1]);
    const e = typeof args[2] === "string" ? this.contentSub(args[2], locals) : jsStr(args[2]);
    const forLocals = new Set(locals);
    forLocals.add(v);
    const b = this.compileBody(args[3], forLocals);
    return `(function(){var __r="";for(var ${v}=Number(${s});${v}<=Number(${e});${v}++){__r+=${b}}return __r})()`;
  }

  compileForeach(args, locals) {
    const v = args[0] || "v";
    const l = typeof args[1] === "string" ? this.contentSub(args[1], locals) : jsStr(args[1]);
    const feLocals = new Set(locals);
    feLocals.add(v);
    const b = this.compileBody(args[2], feLocals);
    return `(function(){var __r="";(${l}).split(" ").forEach(function(${v}){__r+=${b}});return __r})()`;
  }

  compileMatch(args, locals) {
    const expr = typeof args[0] === "string" ? this.exprSub(args[0], locals) : jsStr(args[0]);
    const arms = parse(args[1] || "");
    let result = '""';
    for (let i = arms.length - 1; i >= 0; i--) {
      const arm = arms[i];
      if (!Array.isArray(arm) || arm.length < 2) continue;
      const compiled = this.compileBody(arm[1], locals);
      if (arm[0] === "default") {
        result = compiled;
      } else {
        result = `((${expr} == ${arm[0]}) ? (${compiled}) : (${result}))`;
      }
    }
    return `(${result})`;
  }

  // ── Command dispatch ──

  compileCmd(cmd, locals) {
    if (!Array.isArray(cmd) || cmd.length === 0) return null;
    const name = cmd[0], args = cmd.slice(1);

    switch (name) {
      case "text": return this.compileText(args, locals);
      case "elem": return this.compileElement(args[0] || "div", args[1] || "", locals);
      case "if": return this.compileIf(args, locals);
      case "for": return this.compileFor(args, locals);
      case "foreach": return this.compileForeach(args, locals);
      case "match": return this.compileMatch(args, locals);
      default:
        if (SIDE_EFFECTS.has(name)) return null;
        return this.compileDefault(name, args, locals);
    }
  }

  compileText(args, locals) {
    const VAR_SPLIT = /(?=\$[a-zA-Z_][a-zA-Z0-9_-]*)/;
    const parts = args.flatMap(a => {
      if (typeof a === "string") {
        return a.split(VAR_SPLIT).map(seg => {
          if (!seg) return null;
          if (seg.startsWith("$")) return this.ref(seg, locals);
          return jsStr(seg);
        }).filter(Boolean);
      }
      return [this.compilePart(a, locals, "attr")];
    });
    return parts.length === 0 ? jsStr("") : parts.join(" + ");
  }

  compileDefault(name, args, locals) {
    if (BLOCK_TAGS.has(name)) return this.compileElement(name, args[0] || "", locals);
    if (name === "br" || name === "hr") return jsStr(`<${name}>`);
    if (name === "img") return jsStr(`<img src=${jsStr(args[0] ?? "")} alt=${jsStr(args[1] ?? "")}>`);
    if (this.procNames.has(name)) {
      const fargs = args.map(a =>
        typeof a === "string"
          ? (a.includes("$") ? this.argSub(a, locals) : jsStr(a))
          : this.compilePart(a, locals, "attr")
      );
      return `${name}(${fargs.join(", ")})`;
    }
    return null;
  }

  // ── Body compilation ──

  compileBody(body, locals) {
    const cmds = typeof body === "string" ? parse(body) : body;
    const parts = [];
    for (const cmd of cmds) {
      const r = this.compileCmd(cmd, locals);
      if (r !== null) parts.push(r);
    }
    return parts.length === 0 ? '""' : parts.join(" + ");
  }

  compileProcBody(body, locals) {
    const cmds = typeof body === "string" ? parse(body) : body;
    const stmts = [];
    const contents = [];
    let hasSideEffect = false;

    for (const cmd of cmds) {
      if (!Array.isArray(cmd) || cmd.length === 0) continue;
      if (cmd[0] === "set") {
        hasSideEffect = true;
        this.compileSet(cmd, locals, stmts);
      } else {
        const r = this.compileCmd(cmd, locals);
        if (r !== null) contents.push(r);
      }
    }

    if (!hasSideEffect) return contents.length === 0 ? '""' : contents.join(" + ");

    const lines = ["(function(){var __r='';"];
    for (const s of stmts) lines.push(s + ";");
    for (const c of contents) lines.push("__r+=" + c + ";");
    lines.push("return __r})()");
    return lines.join("");
  }

  // ── Proc compilation ──

  compileProc(cmd) {
    const name = cmd[1];
    const rawParams = cmd[2] || "";
    const body = cmd[3];
    const locals = new Map();
    const params = rawParams.split(/[;\s]+/).filter(Boolean).map(p => {
      const s = sanitizeId(p);
      locals.set(p, s);
      return s;
    });
    return `function ${name}(${params.join(", ")}){return ${this.compileProcBody(body, locals)}}`;
  }

  // ── Main ──

  compile() {
    // Classify commands
    for (const cmd of this.ast) {
      if (!Array.isArray(cmd) || cmd.length === 0) continue;
      const n = cmd[0];
      if (n === "state") this.state[cmd[1]] = cmd[2] ?? "";
      else if (n === "style") this.cssBlocks.push(parseCSS(cmd[1] || ""));
      else if (n === "proc") this.procs.push(cmd);
      else this.renderCmds.push(cmd);
    }

    this.procNames = new Set(this.procs.map(c => c[1]));

    // Compile procs
    const procJS = this.procs.map(cmd => this.compileProc(cmd));

    // Separate init sets from render content
    const initSets = this.renderCmds.filter(c => Array.isArray(c) && c[0] === "set");
    const renderBody = this.renderCmds.filter(c => !(Array.isArray(c) && c[0] === "set"));

    // Apply init sets to state
    for (const cmd of initSets) {
      const args = cmd.slice(1);
      const key = args[0] || "";
      this.state[key] = (args[1] === "expr" && typeof args[2] === "string")
        ? args[2]
        : (args[1] ?? "");
    }

    // Compile render body
    const locals = new Set();
    const renderExprs = renderBody
      .map(cmd => this.compileCmd(cmd, locals))
      .filter(r => r !== null);

    const renderJS = renderExprs.length === 0
      ? 'function render(){return ""}'
      : `function render(){return ${renderExprs.join(" + ")}}`;

    // Assemble JS
    const parts = [];

    if (Object.keys(this.state).length > 0)
      parts.push(`var __s=${JSON.stringify(this.state)};`);

    if (procJS.length) parts.push(procJS.join("\n"));

    parts.push(renderJS);
    parts.push(
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
    parts.push(`function __r(){var t=document.createElement('div');t.innerHTML=render();__diff(document.getElementById('app'),t);}`);
    parts.push(`document.getElementById('app').innerHTML=render();`);

    return { html: "", css: this.cssBlocks.join("\n"), js: parts.join("\n") };
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function compile(ast) {
  return new Compiler(ast).compile();
}
