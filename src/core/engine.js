export const createScope = (parent = null) => ({
  vars: { ...(parent?.vars || {}) },
  parent,
});

export function sub(text, scope) {
  if (typeof text !== "string") return text;
  return text.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g, (match, name) => {
    const value = scope?.vars?.[name] ?? scope?.parent?.vars?.[name];
    return value !== undefined ? String(value) : match;
  });
}

export function evaluate(commands, scope, env) {
  const outputs = [];

  for (const cmd of commands) {
    if (!Array.isArray(cmd) || cmd.length === 0) continue;
    
    // Handle command substitution result (nested array)
    if (Array.isArray(cmd[0]) && !Array.isArray(cmd[0][0])) {
      const result = evaluate(cmd, scope, env);
      return result;
    }

    const cmdName = typeof cmd[0] === "string" ? cmd[0] : null;
    if (!cmdName) continue;
    
    const rawArgs = cmd.slice(1);
    const command = env.cmds[cmdName];

    if (!command) {
      console.error(`Unknown command: '${cmdName}'`);
      continue;
    }

    // Process arguments: evaluate nested arrays (command substitution)
    // Pass both processed and raw args - raw for commands that need them
    const args = rawArgs.map(arg => {
      if (Array.isArray(arg)) {
        const result = evaluate(arg, scope, env);
        return result.join(" ");
      }
      return sub(arg, scope);
    });

    const result = command(args, scope, env, rawArgs);
    
    if (result && result.__khemReturn) {
      return [result.value ?? ""];
    }
    
    if (result !== undefined && result !== null) {
      outputs.push(String(result));
    }
  }

  return outputs;
}

export function render(commands, env) {
  const scope = createScope();
  return evaluate(commands, scope, env).join("");
}
