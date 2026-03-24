import { parse } from "./core/parser.js";
import { evaluate } from "./core/engine.js";
import { loadStdLib } from "./plugins/stdlib.js";
import { loadWebLib } from "./plugins/web.js";

export function createEnvironment() {
  const env = { vars: {}, cmds: {}, styles: [] };

  loadStdLib(env);
  loadWebLib(env);

  return env;
}

export function run(code, customEnv = null) {
  const env = customEnv || createEnvironment();
  const ast = parse(code);
  return evaluate(ast, env);
}
