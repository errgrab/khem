import Khem from "./khem.js";
import { loadWebLib, generateHTML } from "./plugins/web.js";

const parse = Khem.Parser.lex;

export function createEnvironment(webMode = false) {
  const khem = new Khem();
  if (webMode) loadWebLib(khem);
  return khem;
}

export function run(code, env = createEnvironment()) {
  return env.run(code);
}

export function renderForWeb(code, baseDir) {
  const khem = createEnvironment(true);
  if (baseDir) khem._baseDir = baseDir;
  khem._source = code;
  khem._output = khem.run(code);
  return generateHTML(khem);
}

export function processScriptTags(html) {
  const khem = createEnvironment(true);

  return html.replace(
    /<script\s+type="text\/khem"[^>]*>([\s\S]*?)<\/script>/gi,
    (_, code) => {
      try {
        return khem.run(code.trim());
      } catch (e) {
        console.error("Khem script error:", e);
        return `<!-- Error: ${e.message} -->`;
      }
    },
  );
}

export { Khem, parse, loadWebLib, generateHTML };
