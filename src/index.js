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
  const scope = { vars: env.vars, parent: null };
  const result = evaluate(parse(code), scope, env).join("");
  const html = generateHTML(env);
  return html && html.trim() ? html : result;
}

export function processScriptTags(html) {
  const env = createEnvironment(true);
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

export { parse, evaluate, render, createScope, sub };
