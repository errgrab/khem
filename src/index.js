import { parse } from "./core/parser.js";
import { evaluate, sub } from "./core/engine.js";
import { loadStdLib } from "./plugins/stdlib.js";
import { loadWebLib } from "./plugins/web.js";

export function createEnvironment() {
  const env = { vars: {}, cmds: {}, styles: [] };

  loadStdLib(env);
  loadWebLib(env);

  return env;
}

const globalEnv = createEnvironment();

export function run(code, customEnv = null) {
  const env = customEnv || globalEnv;
  const ast = parse(code);
  return evaluate(ast, env);
}

export function updateState(newVars) {
  Object.assign(globalEnv.vars, newVars);
}

export async function boot() {
  if (typeof document === "undefined") return;

  // Runtime exposing
  window.Khem = {
    run,
    evaluate,
    sub,
    createEnvironment,
    env: globalEnv,
  };

  const scripts = Array.from(
    document.querySelectorAll('script[type="text/khem"]'),
  );

  for (const script of scripts) {
    if (script.dataset.khemProcessed) continue;

    let code = script.textContent;
    if (script.hasAttribute("src")) {
      const src = script.getAttribute("src");
      try {
        const resp = await fetch(src);
        code = await resp.text();
      } catch (e) {
        console.error(`Khem Error: Could not load script from ${src}`, e);
        continue;
      }
    }

    try {
      const html = run(code, globalEnv);

      // Inject Styles (always update style tag as more may have been added)
      if (globalEnv.styles.length > 0) {
        let styleTag = document.getElementById("khem-styles");
        if (!styleTag) {
          styleTag = document.createElement("style");
          styleTag.id = "khem-styles";
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = [...new Set(globalEnv.styles)].join("\n");
      }

      if (html && html.trim()) {
        const range = document.createRange();
        range.selectNode(script);
        const fragment = range.createContextualFragment(html.trim());
        script.parentNode.insertBefore(fragment, script);
      }
    } catch (e) {
      console.error("Khem Runtime Error:", e);
    }

    script.dataset.khemProcessed = "true";
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}
