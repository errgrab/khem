export const createScope = (parent) => ({
  vars: Object.create(parent.vars),
  cmds: parent.cmds,
  styles: parent.styles,
});

export const sub = (s, ctx) =>
  typeof s === "string"
    ? s.replace(/\\\$|\$([a-zA-Z0-9_-]+)/g, (m, v) =>
        m === "\\$" ? "$" : ctx.vars[v] !== undefined ? ctx.vars[v] : m,
      )
    : s;

export function evaluate(ast, ctx) {
  if (!Array.isArray(ast)) return "";
  return ast
    .map((stmt) => {
      if (!Array.isArray(stmt) || !stmt.length) return "";
      const args = stmt.slice(1).map((arg) => sub(arg, ctx));
      if (ctx.cmds[stmt[0]]) return ctx.cmds[stmt[0]](args, ctx) || "";

      console.error(`Khem Error: Unknown command '${stmt[0]}'`);
      return "";
    })
    .join("");
}
