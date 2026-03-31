import { parse } from "../core/parser.js";
import { evaluate, createScope } from "../core/engine.js";
import { compile } from "../compiler.js";

// --- CSS parser (khem syntax → CSS) ---
function parseCSS(src, env) {
  const ev = (t) =>
    Array.isArray(t) ? evaluate(t, { vars: env.vars, parent: null }, env).join("") : String(t);
  const fmt = (cmds, ind = "") =>
    parse(cmds)
      .map((cmd) => {
        const last = cmd[cmd.length - 1];
        if (typeof last === "string" && /[;\n]/.test(last))
          return `${ind}${cmd.slice(0, -1).map(ev).join(" ")} { \n${fmt(last, ind + "  ")}${ind}}`;
        return `${ind}${ev(cmd[0])}: ${cmd.slice(1).map(ev).join(" ")};`;
      })
      .join("\n") + "\n";
  return fmt(src);
}

export function loadWebLib(env) {
  const c = env.cmds;
  const ctx = { styles: [] };
  env._webCtx = ctx;
  env._state = env._state || {};

  // --- elem "tag" { body } ---
  c["elem"] = ([tag, body], scope) => {
    if (!tag) return "";
    const bodyStr = typeof body === "string" ? body : "";

    const prevAttrs = env._elemAttrs;
    const prevEvents = env._elemEvents;
    env._elemAttrs = {};
    env._elemEvents = {};

    let content;
    try {
      content = evaluate(parse(bodyStr), scope, env).join("");
    } catch (e) { content = bodyStr; }

    const attrs = { ...env._elemAttrs };
    const events = { ...env._elemEvents };
    env._elemAttrs = prevAttrs;
    env._elemEvents = prevEvents;

    let attrStr = "";
    for (const [k, v] of Object.entries(attrs)) {
      attrStr += v ? ` ${k}="${v}"` : ` ${k}`;
    }
    for (const [evt, js] of Object.entries(events)) {
      attrStr += ` on${evt}='${js}'`;
    }

    const voids = new Set(["br","hr","img","input","meta","link","area","base","col","embed","source","track","wbr"]);
    if (voids.has(tag)) return `<${tag}${attrStr}>`;
    return `<${tag}${attrStr}>${content}</${tag}>`;
  };

  // a "href" { body }
  c["a"] = ([href, body], scope) => {
    const bodyStr = typeof body === "string" ? body : "";
    const prevAttrs = env._elemAttrs;
    const prevEvents = env._elemEvents;
    env._elemAttrs = { href: href ?? "#" };
    env._elemEvents = {};
    let content;
    try { content = evaluate(parse(bodyStr), scope, env).join(""); }
    catch (e) { content = bodyStr; }
    const attrs = { ...env._elemAttrs };
    const events = { ...env._elemEvents };
    env._elemAttrs = prevAttrs;
    env._elemEvents = prevEvents;
    let attrStr = "";
    for (const [k, v] of Object.entries(attrs)) { attrStr += v ? ` ${k}="${v}"` : ` ${k}`; }
    for (const [evt, js] of Object.entries(events)) { attrStr += ` on${evt}='${js}'`; }
    return `<a${attrStr}>${content}</a>`;
  };

  // attr "key" "value"
  c["attr"] = ([key, value]) => {
    if (env._elemAttrs) { env._elemAttrs[key] = value ?? ""; return null; }
    return ` ${key}="${value ?? ""}"`;
  };

  // on "event" { body }
  c["on"] = ([event, body]) => {
    const bodyStr = typeof body === "string" ? body : "";
    const bodyAST = parse(bodyStr);
    const lines = [];
    for (const cmd of bodyAST) {
      if (!Array.isArray(cmd) || cmd.length === 0) continue;
      if (cmd[0] === "set") {
        const key = cmd[1] || "";
        if (cmd[2] === "expr" && typeof cmd[3] === "string") {
          const e = cmd[3].replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g, (_, n) => `Number(__s[${JSON.stringify(n)}])`);
          lines.push(`__s[${JSON.stringify(key)}]=String((function(){try{return eval(${JSON.stringify(e)})}catch{return 0}})())`);
        } else {
          lines.push(`__s[${JSON.stringify(key)}]=${JSON.stringify(cmd[2] ?? "")}`);
        }
      }
    }
    lines.push("__render()");
    const js = lines.join(";");
    if (env._elemEvents) { env._elemEvents[event] = js; return null; }
    return ` on${event}='${js}'`;
  };

  // state "name" "default" — declare reactive state variable
  c["state"] = ([name, value]) => {
    if (name) env._state[name] = value ?? "";
    return null;
  };

  // text "$var" — plain substitution from env._state
  c["text"] = ([content]) => {
    if (!content) return "";
    const state = env._state;
    return content.replace(/\x01/g, "\x02").replace(
      /\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,
      (match, name) => (name in state ? String(state[name]) : match)
    ).replace(/\x02/g, "$");
  };

  // style { ... }
  c["style"] = ([src]) => {
    if (src) ctx.styles.push(parseCSS(src, env));
    return null;
  };

  // page/route/title — no-ops for backward compat
  c["page"] = () => null;
  c["route"] = () => null;
  c["title"] = () => null;

  // --- Register HTML tag commands directly ---
  const blockTags = [
    "div","span","p","h1","h2","h3","h4","h5","h6",
    "ul","ol","li","table","tr","td","th",
    "section","main","header","footer","nav","article",
    "form","pre","code","blockquote","strong","em","button","input"
  ];
  for (const tag of blockTags) {
    c[tag] = ([body], scope) => c["elem"]([tag, body], scope);
  }

  // Void elements
  c["br"] = () => c["elem"](["br", ""]);
  c["hr"] = () => c["elem"](["hr", ""]);

  // img with src/alt
  c["img"] = ([src, alt], scope) => {
    env._elemAttrs = env._elemAttrs || {};
    env._elemEvents = env._elemEvents || {};
    const prevAttrs = env._elemAttrs;
    const prevEvents = env._elemEvents;
    env._elemAttrs = { src: src ?? "", alt: alt ?? "" };
    env._elemEvents = {};
    const attrs = { ...env._elemAttrs };
    const events = { ...env._elemEvents };
    env._elemAttrs = prevAttrs;
    env._elemEvents = prevEvents;
    let attrStr = "";
    for (const [k, v] of Object.entries(attrs)) { attrStr += v ? ` ${k}="${v}"` : ` ${k}`; }
    return `<img${attrStr}>`;
  };

  // Attribute shortcuts
  c["class"] = ([name]) => c["attr"](["class", name]);
  c["id"] = ([name]) => c["attr"](["id", name]);
  c["data"] = ([key, val]) => c["attr"]([`data-${key}`, val]);
  c["href"] = ([url]) => c["attr"](["href", url]);
  c["src"] = ([url]) => c["attr"](["src", url]);
  c["type"] = ([val]) => c["attr"](["type", val]);
  c["value"] = ([val]) => c["attr"](["value", val]);
  c["placeholder"] = ([val]) => c["attr"](["placeholder", val]);

  // Event shortcuts
  c["on_click"] = ([body]) => c["on"](["click", body]);
  c["on_input"] = ([body]) => c["on"](["input", body]);
  c["on_change"] = ([body]) => c["on"](["change", body]);
  c["on_submit"] = ([body]) => c["on"](["submit", body]);
  c["on_keydown"] = ([body]) => c["on"](["keydown", body]);
}

// --- Style CSS for the generated page ---
const DEFAULT_CSS = `:root {
  --bg: #0a0a0a; --s0: #101010; --s1: #161616; --s2: #1e1e1e; --s3: #262626;
  --border: #272727; --b2: #333333;
  --fg: #d4d0c8; --fg1: #aaaaaa; --fg2: #888888; --fg3: #555555; --dim: #484848;
  --acc: #c8a84b; --acc-dim: #7a6628;
  --green: #6b9e78; --green-dim: #2a4a33; --red: #a86b6b; --red-dim: #4a2222;
  --blue: #7a8fa8; --blue-dim: #2a3a4a; --amber: #d4924a;
  --mono: 'DM Mono', 'Fira Mono', ui-monospace, monospace;
  --serif: 'Instrument Serif', Georgia, serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { height: 100%; }
body {
  background: var(--bg); color: var(--fg); font-family: var(--mono);
  font-size: 12px; line-height: 1.6; -webkit-font-smoothing: antialiased;
  padding: 24px; min-height: 100vh; display: flex;
  justify-content: center; align-items: flex-start;
}
#app { width: 100%; max-width: 800px; }
h1, h2, h3 { font-family: var(--serif); font-weight: normal; }
p { color: var(--fg1); }
a { color: var(--acc); text-decoration: none; }
a:hover { text-decoration: underline; }
button {
  background: transparent; border: 1px solid var(--border); color: var(--fg2);
  padding: 4px 12px; cursor: pointer; font-family: inherit; font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.08em; transition: all 0.15s;
}
button:hover { border-color: var(--b2); color: var(--fg); }
.field {
  background: var(--s1); border: 1px solid var(--border); color: var(--fg);
  padding: 8px 10px; font-family: inherit; font-size: 12px; outline: none;
}
.field:focus { border-color: var(--acc); }
`;

export function generateHTML(env) {
  const webCtx = env._webCtx || { styles: [] };
  const state = env._state || {};
  const styles = webCtx.styles.join("\n");
  const body = env._output || "";

  // Use compiler if we have state (reactive mode)
  const stateKeys = Object.keys(state);
  if (stateKeys.length > 0 && env._source) {
    // Compile the source to get pure JS
    const ast = parse(env._source);
    const result = compile(ast, env);
    const allCSS = DEFAULT_CSS + "\n" + result.css;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${allCSS}</style>
</head>
<body>
  <div id="app"></div>
  <script>${result.js}</script>
</body>
</html>`;
  }

  // Non-reactive mode (no state) — use evaluated output directly
  const allCSS = DEFAULT_CSS + "\n" + styles;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${allCSS}</style>
</head>
<body>
  <div id="app">${body}</div>
</body>
</html>`;
}
