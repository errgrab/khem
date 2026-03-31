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
function compileToJS(commands, env) {
  const lines = [];
  for (const cmd of commands) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    const name = cmd[0];
    const args = cmd.slice(1);

    if (name === "set") {
      const key = typeof args[0] === "string" ? args[0] : "";
      // Check if value is an expr sub-command
      if (args[1] === "expr" && typeof args[2] === "string") {
        const raw = args[2].replace(
          /\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,
          (_, n) => `__s[${JSON.stringify(n)}]`
        );
        lines.push(`__set(${JSON.stringify(key)}, (function(){try{return String(eval(${JSON.stringify(raw)}))}catch{return "0"}})())`);
      } else {
        const val = args[1];
        const valJS = typeof val === "string" ? JSON.stringify(val) : `""`;
        lines.push(`__set(${JSON.stringify(key)}, ${valJS})`);
      }
    } else {
      const argStrs = args.map(a =>
        typeof a === "string" ? JSON.stringify(a) : `""`
      );
      lines.push(`__cmd(${JSON.stringify(name)}, ${argStrs.join(", ")})`);
    }
  }
  return lines.join("; ");
}

export function loadWebLib(env) {
  const c = env.cmds;
  const ctx = { styles: [], bootScript: "" };
  env._webCtx = ctx;
  env._state = env._state || {};
  env._stateRefs = env._stateRefs || new Set();

  // --- Reactive text ---
  const origText = c["text"];
  c["text"] = ([content]) => {
    if (!content) return "";
    const state = env._state;
    // Wrap reactive $vars in data-bind spans
    return content.replace(
      /\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,
      (match, name) => {
        if (name in state) {
          env._stateRefs.add(name);
          return `<span data-bind="${name}">${state[name]}</span>`;
        }
        return match;
      }
    );
  };

  // Override set to handle reactive state
  const origSet = c["set"];
  c["set"] = ([key, value], scope) => {
    if (key in env._state) {
      env._state[key] = value ?? "";
      env._stateRefs.add(key);
      return null;
    }
    return origSet([key, value], scope);
  };

  // --- Primitives ---

  // elem "tag" { body }
  c["elem"] = ([tag, body], scope) => {
    if (!tag) return "";
    const bodyStr = typeof body === "string" ? body : "";

    // Save attr context (stack for nesting)
    const prevAttrs = env._elemAttrs;
    const prevEvents = env._elemEvents;
    env._elemAttrs = {};
    env._elemEvents = {};

    // Evaluate body — attr/on set context, other commands produce output
    let content;
    try {
      const bodyAST = parse(bodyStr);
      content = evaluate(bodyAST, scope, env).join("");
    } catch (e) {
      content = bodyStr;
    }

    // Read accumulated attrs
    const attrs = { ...env._elemAttrs };
    const events = { ...env._elemEvents };

    // Restore context
    env._elemAttrs = prevAttrs;
    env._elemEvents = prevEvents;

    // Build attrs string
    let attrStr = "";
    for (const [k, v] of Object.entries(attrs)) {
      attrStr += v ? ` ${k}="${v}"` : ` ${k}`;
    }
    for (const [evt, js] of Object.entries(events)) {
      attrStr += ` on${evt}='${js}'`;
    }

    // Self-closing void elements
    const voids = new Set(["br","hr","img","input","meta","link","area","base","col","embed","source","track","wbr"]);
    if (voids.has(tag)) return `<${tag}${attrStr}>`;

    return `<${tag}${attrStr}>${content}</${tag}>`;
  };

  // a "href" { body } — link element with href as first arg
  c["a"] = ([href, body], scope) => {
    const bodyStr = typeof body === "string" ? body : "";
    const prevAttrs = env._elemAttrs;
    const prevEvents = env._elemEvents;
    env._elemAttrs = { href: href ?? "#" };
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
    for (const [k, v] of Object.entries(attrs)) { attrStr += v ? ` ${k}="${v}"` : ` ${k}`; }
    for (const [evt, js] of Object.entries(events)) { attrStr += ` on${evt}='${js}'`; }
    return `<a${attrStr}>${content}</a>`;
  };

  // attr "key" "value" — sets attribute on enclosing elem, or returns html string
  c["attr"] = ([key, value]) => {
    if (env._elemAttrs) {
      env._elemAttrs[key] = value ?? "";
      return null;
    }
    // Outside elem context: return attr string for composition
    return ` ${key}="${value ?? ""}"`;
  };

  // on "event" { body } — binds event on enclosing elem, or returns html string
  c["on"] = ([event, body]) => {
    const bodyStr = typeof body === "string" ? body : "";
    const js = compileToJS(parse(bodyStr), env);
    if (env._elemEvents) {
      env._elemEvents[event] = js;
      return null;
    }
    return ` on${event}='${js}'`;
  };

  // state "name" "default" — declares reactive state
  c["state"] = ([name, value]) => {
    if (name) env._state[name] = value ?? "";
    return null;
  };

  // style { ... } — CSS in khem syntax
  c["style"] = ([src]) => {
    if (src) ctx.styles.push(parseCSS(src, env));
    return null;
  };
}

export function generateHTML(env) {
  const ctx = env._webCtx || { styles: [], bootScript: "" };
  const state = env._state || {};
  const refs = env._stateRefs || new Set();

  const userStyles = ctx.styles.join("\n");

  // Generate bootstrap script for reactive state
  let bootScript = "";
  if (refs.size > 0) {
    const stateObj = {};
    for (const name of refs) {
      if (name in state) stateObj[name] = state[name];
    }
    bootScript = `
var __s=${JSON.stringify(stateObj)};
function __set(k,v){__s[k]=v;
document.querySelectorAll('[data-bind="'+k+'"]').forEach(function(e){e.textContent=v;});
}`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${userStyles}
  </style>
</head>
<body>
  <div id="app">${env._output || ""}</div>
  ${bootScript ? `<script>${bootScript}</script>` : ""}
</body>
</html>`;
}

// --- Backward compatibility ---
export function runWeb(code, env) {
  const scope = { vars: env.vars, parent: null };
  env._output = evaluate(parse(code), scope, env).join("");
  return generateHTML(env);
}
