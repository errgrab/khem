export const createScope = (parent) => ({
  vars: Object.create(parent.vars),
  cmds: parent.cmds,
  styles: parent.styles,
});

export const isRuntimeValue = (value) => {
  if (value === null) return true;
  if (Array.isArray(value)) return true;
  return ["string", "number", "boolean"].includes(typeof value);
};

export const sub = (s, ctx) => {
  if (typeof s !== "string") return s;
  return s.replace(/\\\$|\$([a-zA-Z0-9_-]+)/g, (m, v) => {
    if (m === "\\$") return "$";
    const val = ctx.vars[v];
    return val !== undefined ? String(val) : m;
  });
};

export const toRuntimeValue = (value) => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return String(value);
};

export const renderValue = (value, ctx) => {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (Array.isArray(value)) {
    // Blocks/lists are rendered item-by-item.
    return value.map((item) => renderValue(item, ctx)).join("");
  }
  return String(value);
};

export const renderValues = (values, ctx) => {
  if (!Array.isArray(values)) return renderValue(values, ctx);
  return values.map((value) => renderValue(value, ctx)).join("");
};

export function evaluate(ast, ctx) {
  if (!Array.isArray(ast)) return [];
  const out = [];
  for (const stmt of ast) {
    if (!Array.isArray(stmt) || !stmt.length) continue;
    const cmdName = stmt[0];
    const rawArgs = stmt.slice(1);
    const command = ctx.cmds[cmdName];

    if (!command) {
      console.error(`Khem Error: Unknown command '${cmdName}'`);
      continue;
    }

    const args = rawArgs.map((arg) =>
      Array.isArray(arg) ? arg : toRuntimeValue(sub(arg, ctx)),
    );
    const result = toRuntimeValue(command(args, ctx));

    if (!isRuntimeValue(result)) {
      throw new Error(
        `Khem Error: Command '${cmdName}' returned unsupported runtime value.`,
      );
    }

    out.push(result);
  }

  return out;
}

export const render = (ast, ctx) => renderValues(evaluate(ast, ctx), ctx);
