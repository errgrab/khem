import Khem from "../khem.js";
import { compile } from "../compiler.js";
import { VOID_ELEMENTS, BLOCK_TAGS, parseCSS } from "../shared.js";
import { DEFAULT_CSS } from "../styles.js";

const parse = Khem.Parser.lex;

// ─── Helpers de elemento ─────────────────────────────────────────────────────

// Salva e restaura contexto de attrs/events (permite nesting)
function pushElemContext(env) {
  const prev = { attrs: env._elemAttrs, events: env._elemEvents };
  env._elemAttrs = {};
  env._elemEvents = {};
  return prev;
}

function popElemContext(env, prev) {
  const attrs = { ...env._elemAttrs };
  const events = { ...env._elemEvents };
  env._elemAttrs = prev.attrs;
  env._elemEvents = prev.events;
  return { attrs, events };
}

// Avalia body de elemento e retorna conteúdo HTML
function evalElementBody(body, vm) {
  const bodyStr = typeof body === "string" ? body : "";
  try {
    return vm.evaluate(bodyStr).join("");
  } catch {
    return bodyStr;
  }
}

// Monta string de atributos a partir de attrs e events
function buildAttrStr(attrs, events) {
  let s = "";
  for (const [k, v] of Object.entries(attrs)) {
    s += v ? ` ${k}="${v}"` : ` ${k}`;
  }
  for (const [evt, js] of Object.entries(events)) {
    s += ` on${evt}='${js}'`;
  }
  return s;
}

// Renderiza elemento HTML completo
function renderElement(tag, body, vm, env) {
  const prev = pushElemContext(env);
  const content = evalElementBody(body, vm);
  const { attrs, events } = popElemContext(env, prev);
  const attrStr = buildAttrStr(attrs, events);

  if (VOID_ELEMENTS.has(tag)) return `<${tag}${attrStr}>`;
  return `<${tag}${attrStr}>${content}</${tag}>`;
}

// ─── Load Web Library ───────────────────────────────────────────────────────

export function loadWebLib(env) {
  const c = env.scope.commands;
  const ctx = { styles: [] };
  env._webCtx = ctx;
  env._state = env._state || {};

  const vm = env.vm;

  // ── Elementos ──

  c.set("elem", ([tag, body]) => renderElement(tag || "div", body, vm, env));

  c.set("a", ([href, body]) => {
    const prev = pushElemContext(env);
    env._elemAttrs = { href: href ?? "#" };
    const content = evalElementBody(body, vm);
    const { attrs, events } = popElemContext(env, prev);
    return `<a${buildAttrStr(attrs, events)}>${content}</a>`;
  });

  c.set("img", ([src, alt]) => {
    const prev = pushElemContext(env);
    env._elemAttrs = { src: src ?? "", alt: alt ?? "" };
    const { attrs } = popElemContext(env, prev);
    return `<img${buildAttrStr(attrs, {})}>`;
  });

  // Block tags: div, span, p, h1, etc → todos chamam elem
  for (const tag of BLOCK_TAGS) {
    if (tag === "a" || tag === "img") continue;
    c.set(tag, ([body]) => renderElement(tag, body, vm, env));
  }

  c.set("br", () => "<br>");
  c.set("hr", () => "<hr>");

  // ── Atributos ──

  c.set("attr", ([key, value]) => {
    if (env._elemAttrs) { env._elemAttrs[key] = value ?? ""; return null; }
    return ` ${key}="${value ?? ""}"`;
  });

  // Atalhos de atributos
  c.set("class", ([name]) => c.get("attr")(["class", name]));
  c.set("id", ([name]) => c.get("attr")(["id", name]));
  c.set("data", ([key, val]) => c.get("attr")([`data-${key}`, val]));
  c.set("href", ([url]) => c.get("attr")(["href", url]));
  c.set("src", ([url]) => c.get("attr")(["src", url]));
  c.set("type", ([val]) => c.get("attr")(["type", val]));
  c.set("value", ([val]) => c.get("attr")(["value", val]));
  c.set("placeholder", ([val]) => c.get("attr")(["placeholder", val]));

  // ── Eventos ──

  c.set("on", ([event, body]) => {
    const bodyStr = typeof body === "string" ? body : "";
    const bodyAST = parse(bodyStr);
    const lines = [];

    for (const cmd of bodyAST) {
      if (!Array.isArray(cmd) || cmd.length === 0) continue;
      if (cmd[0] === "set") {
        const key = cmd[1] || "";
        if (cmd[2] === "expr" && typeof cmd[3] === "string") {
          const e = cmd[3].replace(
            /\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,
            (_, n) => `Number(__s[${JSON.stringify(n)}])`
          );
          lines.push(
            `__s[${JSON.stringify(key)}]=String((function(){try{return eval(${JSON.stringify(e)})}catch{return 0}})())`
          );
        } else {
          lines.push(`__s[${JSON.stringify(key)}]=${JSON.stringify(cmd[2] ?? "")}`);
        }
      }
    }
    lines.push("__render()");
    const js = lines.join(";");

    if (env._elemEvents) { env._elemEvents[event] = js; return null; }
    return ` on${event}='${js}'`;
  });

  // Atalhos de eventos
  c.set("on_click", ([body]) => c.get("on")(["click", body]));
  c.set("on_input", ([body]) => c.get("on")(["input", body]));
  c.set("on_change", ([body]) => c.get("on")(["change", body]));
  c.set("on_submit", ([body]) => c.get("on")(["submit", body]));
  c.set("on_keydown", ([body]) => c.get("on")(["keydown", body]));

  // ── Estado ──

  c.set("state", ([name, value]) => {
    if (name) env._state[name] = value ?? "";
    return null;
  });

  // Override set para registrar em env._state (torna vars reativas)
  const origSet = c.get("set");
  c.set("set", ([key, value]) => {
    if (key) env._state[key] = value ?? "";
    return origSet([key, value], vm);
  });

  // text com substituição de $var do state
  c.set("text", ([content]) => {
    if (!content) return "";
    const state = env._state;
    return content
      .replace(/\x01/g, "\x02")
      .replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g, (match, name) =>
        name in state ? String(state[name]) : match
      )
      .replace(/\x02/g, "$");
  });

  // ── Style ──

  c.set("style", ([src]) => {
    if (src) {
      const evalFn = (t) => vm.evaluate(t).join("");
      ctx.styles.push(parseCSS(src, evalFn));
    }
    return null;
  });

  // ── Compatibilidade (no-ops) ──

  c.set("page", () => null);
  c.set("route", () => null);
  c.set("title", () => null);
}

// ─── HTML Generation ─────────────────────────────────────────────────────────

export function generateHTML(env) {
  const webCtx = env._webCtx || { styles: [] };
  const state = env._state || {};
  const styles = webCtx.styles.join("\n");
  const body = env._output || "";
  const css = DEFAULT_CSS + "\n" + styles;

  // Modo reativo: compila AST → JS puro
  if (Object.keys(state).length > 0 && env._source) {
    const ast = parse(env._source);
    const result = compile(ast);
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

  // Modo estático: usa output avaliado diretamente
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>
  <div id="app">${body}</div>
</body>
</html>`;
}
