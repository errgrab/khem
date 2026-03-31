export const createScope = (parent = null) => ({ vars: {}, parent });

export const lookup = (scope, name) => {
  let s = scope;
  while (s) {
    if (name in s.vars) return String(s.vars[name]);
    s = s.parent;
  }
  return null;
};

export function sub(text, scope) {
  if (typeof text !== "string") return text;
  return text.replace(
    /\$([a-zA-Z_][a-zA-Z0-9_-]*)/g,
    (match, name) => lookup(scope, name) ?? match,
  );
}

export function evaluate(commands, scope, env) {
  const outputs = [];
  const subFn = env.sub ?? sub;

  for (const cmd of commands) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;

    const cmdName = typeof cmd[0] === "string" ? cmd[0] : null;
    if (!cmdName) continue;

    const command = env.cmds[cmdName];
    if (!command) {
      console.error(`Unknown command: ${cmdName}`);
      continue;
    }
    const rawArgs = cmd.slice(1);
    const args = rawArgs.map((arg) =>
      Array.isArray(arg) ? evaluate(arg, scope, env).join("") : subFn(arg, scope),
    );
    const result = command(args, scope);
    if (result?.__khemReturn) return [result.value ?? ""];
    if (result != null) outputs.push(String(result));
  }

  return outputs;
}

export function render(commands, env) {
  return evaluate(commands, createScope(), env).join("");
}
