import { parse } from "./core/parser.js";
import { evaluate, render, createScope, sub } from "./core/engine.js";
import { loadStdLib } from "./plugins/stdlib.js";
import { loadWebLib, generateHTML, resetWebState } from "./plugins/web.js";

export function createEnvironment(webMode = false) {
  const env = {
    cmds: {},
    webMode,
    vars: {},
  };
  loadStdLib(env);
  if (webMode) loadWebLib(env);
  return env;
}

const globalEnv = createEnvironment();

export function run(code, customEnv = null) {
  const env = customEnv || globalEnv;
  const commands = parse(code);
  // Use env.vars as the scope so state persists across calls
  const scope = { vars: env.vars, parent: null };
  const output = evaluate(commands, scope, env).join("");
  
  if (env.webMode) {
    return generateHTML(env, code);
  }
  
  return output;
}

// Run Khem code for web output (returns complete HTML)
export function runForWeb(code, title, baseDir) {
  const env = createEnvironment(true);
  if (title) env._webTitle = title;
  if (baseDir) env._baseDir = baseDir;
  const commands = parse(code);
  const scope = { vars: env.vars, parent: null };
  evaluate(commands, scope, env);
  return generateHTML(env, code);
}

// Process <script type="text/khem"> tags in HTML
export function processScriptTags(html) {
  // Create a shared environment for all script tags
  const env = createEnvironment(true);
  
  return html.replace(
    /<script\s+type="text\/khem"[^>]*>([\s\S]*?)<\/script>/gi,
    (match, code) => {
      try {
        const scope = { vars: env.vars, parent: null };
        return evaluate(parse(code.trim()), scope, env).join("");
      } catch (e) {
        console.error("Khem script error:", e);
        return `<!-- Error: ${e.message} -->`;
      }
    }
  );
}

export { parse, evaluate, render, createScope, sub, resetWebState };
