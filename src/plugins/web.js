import { parse } from "../core/parser.js";
import { evaluate, createScope, sub, lookup } from "../core/engine.js";

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

// --- Khem → JS compiler (for event handlers) ---
function compileToJS(commands, env, rawAST) {
  const lines = [];
  for (let ci = 0; ci < commands.length; ci++) {
    const cmd = commands[ci];
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    const name = cmd[0];
    const args = cmd.slice(1);

    if (name === "set") {
      const key = typeof args[0] === "string" ? args[0] : "";
      const rawCmd = rawAST && rawAST[ci] ? rawAST[ci] : cmd;
      const rawArgs = rawCmd.slice(1);

      if (args[1] === "expr" && typeof args[2] === "string") {
        const rawExpr = typeof rawArgs[2] === "string" ? rawArgs[2] : args[2];
        const jsExpr = rawExpr.replace(
          /\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,
          (_, n) => `Number(__s[${JSON.stringify(n)}])`
        );
        lines.push(`__s[${JSON.stringify(key)}]=String((function(){try{return eval(${JSON.stringify(jsExpr)})}catch{return 0}})())`);
      } else {
        const val = args[1];
        const valJS = typeof val === "string" ? JSON.stringify(val) : `""`;
        lines.push(`__s[${JSON.stringify(key)}]=${valJS}`);
      }
    } else {
      const argStrs = args.map(a =>
        typeof a === "string" ? JSON.stringify(a) : `""`
      );
      lines.push(`(${name})(${argStrs.join(", ")})`);
    }
  }
  return lines.join("; ");
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
    const js = compileToJS(bodyAST, env, bodyAST) + ";__render()";
    if (env._elemEvents) { env._elemEvents[event] = js; return null; }
    return ` on${event}='${js}'`;
  };

  // state "name" "default"
  c["state"] = ([name, value]) => {
    if (name) env._state[name] = value ?? "";
    return null;
  };

  // text "content"
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
}

export function generateHTML(env) {
  const webCtx = env._webCtx || { styles: [] };
  const state = env._state || {};
  const styles = webCtx.styles.join("\n");
  const body = env._output || "";

  const stateKeys = Object.keys(state);
  let bootScript = "";

  if (stateKeys.length > 0) {
    const srcEscaped = (env._source || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");

    bootScript = `
var __s=${JSON.stringify(state)};
var __src='${srcEscaped}';
var __ast=khem.parse(__src);
function __render(){
var _env=khem.createEnvironment(true);
_env._state=__s;
var _scope=khem.createScope();_scope.vars=__s;
document.getElementById('app').innerHTML=khem.evaluate(__ast,_scope,_env).join('');
}
`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${styles}</style>
</head>
<body>
  <div id="app">${body}</div>
  ${stateKeys.length > 0 ? `<script src="khem-runtime.js"></script>` : ""}
  ${bootScript ? `<script>${bootScript}</script>` : ""}
</body>
</html>`;
}

// Backward compat
export function runWeb(code, env) {
  const scope = { vars: env.vars, parent: null };
  env._output = evaluate(parse(code), scope, env).join("");
  return generateHTML(env);
}
