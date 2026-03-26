import { parse } from "./core/parser.js";
import { evaluate, render, sub } from "./core/engine.js";
import { loadStdLib } from "./plugins/stdlib.js";
import { loadWebLib } from "./plugins/web.js";

export function createEnvironment() {
  const env = {
    vars: {},
    cmds: {},
    styles: [],
    stateKeys: new Set(),
    persistKeys: new Set(),
    derivations: [],
    renderers: [],
    notifyStateChange: () => { },
  };

  env.notifyStateChange = (changedKeys = []) => {
    const changed = Array.isArray(changedKeys) ? changedKeys : [changedKeys];

    for (const derivation of env.derivations) {
      if (
        changed.length > 0 &&
        derivation.deps &&
        !changed.some((key) => derivation.deps.has(key))
      ) {
        continue;
      }

      try {
        const collector = new Set();
        env.__activeCollector = collector;
        env.vars[derivation.key] = derivation.compute();
        derivation.deps = collector;
      } catch (error) {
        console.error(`Khem derive error for '${derivation.key}':`, error);
      } finally {
        env.__activeCollector = null;
      }
    }

    env.renderers.forEach((renderer) => {
      if (
        changed.length > 0 &&
        renderer.deps &&
        renderer.deps.size > 0 &&
        !changed.some((key) => renderer.deps.has(key))
      ) {
        return;
      }
      renderer();
    });
  };

  loadStdLib(env);
  loadWebLib(env);

  return env;
}

const globalEnv = createEnvironment();

export function run(code, customEnv = null) {
  const env = customEnv || globalEnv;
  const ast = parse(code);
  return render(ast, env);
}

export function updateState(newVars) {
  Object.assign(globalEnv.vars, newVars);
  globalEnv.notifyStateChange(Object.keys(newVars));
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

    const startMarker = document.createComment("khem:start");
    const endMarker = document.createComment("khem:end");
    script.parentNode.insertBefore(startMarker, script);
    script.parentNode.insertBefore(endMarker, script.nextSibling);

    const renderScript = () => {
      let cursor = startMarker.nextSibling;
      while (cursor && cursor !== endMarker) {
        const next = cursor.nextSibling;
        cursor.remove();
        cursor = next;
      }

      const collector = new Set();
      globalEnv.__activeCollector = collector;
      const html = run(code, globalEnv);
      renderScript.deps = collector;
      globalEnv.__activeCollector = null;

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
        range.selectNode(endMarker);
        const fragment = range.createContextualFragment(html.trim());
        endMarker.parentNode.insertBefore(fragment, endMarker);
      }
    };

    try {
      renderScript();
    } catch (e) {
      console.error("Khem Runtime Error:", e);
    }

    if (!globalEnv.renderers.includes(renderScript)) {
      globalEnv.renderers.push(renderScript);
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
