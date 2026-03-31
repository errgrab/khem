// src/compiler.js — Khem AST → { html, css, js }
import { parse } from "./core/parser.js";

function jsStr(s) {
  return JSON.stringify(String(s));
}

// Convert $var: global → __s["x"], local → x
function compileRef(name, locals) {
  if (locals && locals.has(name)) return name;
  return `__s[${jsStr(name)}]`;
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

// Compile set command to JS statement (for render function)
function compileSetStmt(cmd, locals, out) {
  const args = cmd.slice(1);
  const ref = compileRef(args[0] || "", locals);
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
  const ref = compileRef(args[0] || "", locals);
  if (args[1] === "expr" && typeof args[2] === "string") {
    const e = compileExpr(args[2], locals);
    out.push(`${ref}=String((function(){try{return eval("${e.replace(/"/g, '\\"')}")}catch{return 0}})())`);
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
    if (Array.isArray(c) && c[0] === "set") compileSetHandler(c, locals, js);
  }
  js.push("__r()");
  return ` on${event}='${js.join(";")}'`;
}

// Build attribute string for an element from its body commands
// Returns { attrStr, contentCmds } where attrStr is like ' class="app" id="x"'
function extractAttrs(body, locals) {
  const cmds = parse(typeof body === "string" ? body : "");
  let attrStr = "";
  const contentCmds = [];
  for (const cmd of cmds) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    const n = cmd[0], a = cmd.slice(1);
    if (n === "class") attrStr += ` class=${jsStr(a[0] ?? "")}`;
    else if (n === "id") attrStr += ` id=${jsStr(a[0] ?? "")}`;
    else if (n === "href") attrStr += ` href=${jsStr(a[0] ?? "")}`;
    else if (n === "src") attrStr += ` src=${jsStr(a[0] ?? "")}`;
    else if (n === "type") attrStr += ` type=${jsStr(a[0] ?? "")}`;
    else if (n === "value") attrStr += ` value=${jsStr(a[0] ?? "")}`;
    else if (n === "placeholder") attrStr += ` placeholder=${jsStr(a[0] ?? "")}`;
    else if (n === "data") attrStr += ` data-${a[0] ?? ""}=${jsStr(a[1] ?? "")}`;
    else if (n === "attr") attrStr += ` ${a[0] ?? ""}=${jsStr(a[1] ?? "")}`;
    else if (n === "on" || n.startsWith("on_")) attrStr += compileEventAttr(cmd, locals);
    else contentCmds.push(cmd);
  }
  return { attrStr, contentCmds };
}

// Compile list of content commands to JS expression
function compileContentCmds(cmds, locals) {
  const parts = [];
  for (const cmd of cmds) {
    const r = compileOneContent(cmd, locals);
    if (r !== null) parts.push(r);
  }
  return parts.length === 0 ? '""' : parts.join(" + ");
}

// Compile element (tag + body) to JS expression
function compileElement(tag, body, locals) {
  const { attrStr, contentCmds } = extractAttrs(body, locals);
  const content = compileContentCmds(contentCmds, locals);
  const voids = new Set(["br","hr","img","input","meta","link","area","base","col","embed","source","track","wbr"]);
  if (voids.has(tag)) return jsStr(`<${tag}${attrStr}>`);
  return jsStr(`<${tag}${attrStr}>`) + " + " + content + " + " + jsStr(`</${tag}>`);
}

// Compile one content command to JS expression (or null)
function compileOneContent(cmd, locals) {
  if (!Array.isArray(cmd) || cmd.length === 0) return null;
  const name = cmd[0], args = cmd.slice(1);

  switch (name) {
    case "text": {
      const s = args[0] ?? "";
      if (typeof s !== "string") return jsStr(s);
      const subbed = contentSub(s, locals);
      return subbed === s ? jsStr(s) : `"${subbed}"`;
    }
    case "elem":
      return compileElement(args[0] || "div", args[1] || "", locals);
    case "if": {
      const cond = typeof args[0] === "string" ? contentSub(args[0], locals) : jsStr(args[0]);
      const body = compileContentBody(args[1], locals);
      if (args[2] === "else" && args[3]) {
        const elseBody = compileContentBody(args[3], locals);
        return `((${cond}) ? (${body}) : (${elseBody}))`;
      }
      return `((${cond}) ? (${body}) : (""))`;
    }
    case "for": {
      const v = args[0] || "i";
      const s = typeof args[1] === "string" ? contentSub(args[1], locals) : jsStr(args[1]);
      const e = typeof args[2] === "string" ? contentSub(args[2], locals) : jsStr(args[2]);
      const b = compileContentBody(args[3], locals);
      return `(function(){var __r="";for(var ${v}=Number(${s});${v}<=Number(${e});${v}++){__r+=${b}}return __r})()`;
    }
    case "foreach": {
      const v = args[0] || "v";
      const l = typeof args[1] === "string" ? contentSub(args[1], locals) : jsStr(args[1]);
      const b = compileContentBody(args[2], locals);
      return `(function(){var __r="";(${l}).split(" ").forEach(function(${v}){__r+=${b}});return __r})()`;
    }
    case "proc": case "set": case "on":
      return null;
    default: {
      // Block tag shorthand: div { ... } → same as elem "div" { ... }
      const blockTags = new Set([
        "div","span","p","h1","h2","h3","h4","h5","h6",
        "ul","ol","li","table","tr","td","th",
        "section","main","header","footer","nav","article",
        "form","pre","code","blockquote","strong","em","button","input","a",
      ]);
      if (blockTags.has(name)) return compileElement(name, args[0] || "", locals);
      if (name === "br" || name === "hr") return jsStr(`<${name}>`);
      if (name === "img") return jsStr(`<img src=${jsStr(args[0] ?? "")} alt=${jsStr(args[1] ?? "")}>`);
      return null;
    }
  }
}

// Compile body string to content-only JS expression
function compileContentBody(body, locals) {
  const cmds = typeof body === "string" ? parse(body) : body;
  return compileContentCmds(cmds, locals);
}

// Compile body to JS statements (for render function with possible set/on mixed in)
function compileBodyToStmts(body, locals) {
  const cmds = typeof body === "string" ? parse(body) : body;
  const stmts = [];
  const contents = [];
  let hasSideEffect = false;
  for (const cmd of cmds) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    if (cmd[0] === "set") { hasSideEffect = true; compileSetStmt(cmd, locals, stmts); }
    else if (cmd[0] === "on") { hasSideEffect = true; /* skip event in render */ }
    else { const r = compileOneContent(cmd, locals); if (r !== null) contents.push(r); }
  }
  if (!hasSideEffect) {
    if (contents.length === 0) return ["__r+='';"];
    return ["__r+=" + contents.join(" + ") + ";"];
  }
  for (const c of contents) stmts.push("__r+=" + c + ";");
  return stmts;
}

// Compile proc body (may mix set + content → IIFE)
function compileProcBody(body, locals) {
  const cmds = typeof body === "string" ? parse(body) : body;
  const stmts = [];
  const contents = [];
  let hasSideEffect = false;
  for (const cmd of cmds) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    if (cmd[0] === "set") { hasSideEffect = true; compileSetStmt(cmd, locals, stmts); }
    else { const r = compileOneContent(cmd, locals); if (r !== null) contents.push(r); }
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
  const procJS = [];
  for (const cmd of procFuncs) {
    const name = cmd[1];
    const rawParams = cmd[2] || "";
    const body = cmd[3];
    const paramCmds = parse(rawParams);
    const params = paramCmds.map(p => typeof p === "string" ? p : String(p[0]));
    const locals = new Set(params);
    procJS.push(`function ${name}(${params.join(", ")}){return ${compileProcBody(body, locals)}}`);
  }

  // Compile render body
  const locals = new Set();
  const renderStmts = [];
  for (const cmd of renderCmds) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    const n = cmd[0];
    if (n === "set") {
      compileSetStmt(cmd, locals, renderStmts);
    } else {
      const expr = compileOneContent(cmd, locals);
      if (expr !== null) {
        renderStmts.push(expr);
      }
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
