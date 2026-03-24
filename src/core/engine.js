export const createScope = (parent) => ({
  vars: Object.create(parent.vars),
  cmds: parent.cmds,
  styles: parent.styles,
});

export const sub = (s, ctx) => {
  if (typeof s !== "string") return s;
  const result = s.replace(/\\\$|\$([a-zA-Z0-9_-]+)/g, (m, v) => {
    if (m === "\\$") return "$";
    const val = ctx.vars[v];
    return val !== undefined ? val : m;
  });
  return result;
};

export function evaluate(ast, ctx) {
  if (!Array.isArray(ast)) return "";
  return ast
    .map((stmt) => {
      if (!Array.isArray(stmt) || !stmt.length) return "";

      const cmdName = stmt[0];
      const rawArgs = stmt.slice(1);

      const args = rawArgs.map((arg) => {
        if (Array.isArray(arg)) return arg;
        return sub(arg, ctx);
      });

      if (ctx.cmds[cmdName]) return ctx.cmds[cmdName](args, ctx) || "";

      console.error(`Khem Error: Unknown command '${cmdName}'`);
      return "";
    })
    .join("");
}
