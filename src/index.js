import { parse } from "./core/parser.js";
import { evaluate, render, createScope, sub } from "./core/engine.js";
import { loadStdLib } from "./plugins/stdlib.js";
import { loadWebLib, generateHTML } from "./plugins/web.js";

export function createEnvironment(webMode = false) {
  const env = { cmds: {}, vars: {} };
  loadStdLib(env);
  if (webMode) loadWebLib(env);
  return env;
}

export function run(code, env = createEnvironment()) {
  return evaluate(parse(code), { vars: env.vars, parent: null }, env).join("");
}

export function renderForWeb(code, baseDir) {
  const env = createEnvironment(true);
  if (baseDir) env._baseDir = baseDir;
  env._source = code;

  // Load web.kh (user-facing procs: div, span, class, on_click, etc.)
  const webKh = loadWebKh();
  if (webKh) {
    const scope = { vars: env.vars, parent: null };
    evaluate(parse(webKh), scope, env);
  }

  const scope = { vars: env.vars, parent: null };
  env._output = evaluate(parse(code), scope, env).join("");
  return generateHTML(env);
}

export function processScriptTags(html) {
  const env = createEnvironment(true);

  // Load web.kh
  const webKh = loadWebKh();
  if (webKh) {
    const scope = { vars: env.vars, parent: null };
    evaluate(parse(webKh), scope, env);
  }

  return html.replace(
    /<script\s+type="text\/khem"[^>]*>([\s\S]*?)<\/script>/gi,
    (_, code) => {
      try {
        const scope = { vars: env.vars, parent: null };
        return evaluate(parse(code.trim()), scope, env).join("");
      } catch (e) {
        console.error("Khem script error:", e);
        return `<!-- Error: ${e.message} -->`;
      }
    },
  );
}

let _webKhCache = null;
function loadWebKh() {
  if (_webKhCache) return _webKhCache;
  _webKhCache = WEB_KH_INLINE;
  return _webKhCache;
}

// Inline copy for bundled environments
const WEB_KH_INLINE = `proc div {body} { elem "div" "$body" }
proc span {body} { elem "span" "$body" }
proc p {body} { elem "p" "$body" }
proc h1 {body} { elem "h1" "$body" }
proc h2 {body} { elem "h2" "$body" }
proc h3 {body} { elem "h3" "$body" }
proc h4 {body} { elem "h4" "$body" }
proc h5 {body} { elem "h5" "$body" }
proc h6 {body} { elem "h6" "$body" }
proc ul {body} { elem "ul" "$body" }
proc ol {body} { elem "ol" "$body" }
proc li {body} { elem "li" "$body" }
proc table {body} { elem "table" "$body" }
proc tr {body} { elem "tr" "$body" }
proc td {body} { elem "td" "$body" }
proc th {body} { elem "th" "$body" }
proc section {body} { elem "section" "$body" }
proc main {body} { elem "main" "$body" }
proc header {body} { elem "header" "$body" }
proc footer {body} { elem "footer" "$body" }
proc nav {body} { elem "nav" "$body" }
proc article {body} { elem "article" "$body" }
proc form {body} { elem "form" "$body" }
proc pre {body} { elem "pre" "$body" }
proc code {body} { elem "code" "$body" }
proc blockquote {body} { elem "blockquote" "$body" }
proc strong {body} { elem "strong" "$body" }
proc em {body} { elem "em" "$body" }
proc button {body} { elem "button" "$body" }
proc br {} { elem "br" "" }
proc hr {} { elem "hr" "" }
proc img {src; alt ""} { elem "img" ""; attr "src" "$src"; attr "alt" "$alt" }
proc input {body} { elem "input" "$body" }
proc class {name} { attr "class" "$name" }
proc id {name} { attr "id" "$name" }
proc data {key; val} { attr "data-$key" "$val" }
proc href {url} { attr "href" "$url" }
proc src {url} { attr "src" "$url" }
proc type {val} { attr "type" "$val" }
proc value {val} { attr "value" "$val" }
proc placeholder {val} { attr "placeholder" "$val" }
proc on_click {body} { on "click" "$body" }
proc on_input {body} { on "input" "$body" }
proc on_change {body} { on "change" "$body" }
proc on_submit {body} { on "submit" "$body" }
proc on_keydown {body} { on "keydown" "$body" }`;

export { parse, evaluate, render, createScope, sub };
