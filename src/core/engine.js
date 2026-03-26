export const createScope = (parent) => ({
  vars: Object.create(parent.vars),
  cmds: parent.cmds,
  styles: parent.styles,
});

export const isRuntimeValue = (value) => {
  if (value === null) return true;
  if (Array.isArray(value)) return true;
  if (typeof value === "object") return true;
  return ["string", "number", "boolean"].includes(typeof value);
};

export const sub = (s, ctx) => {
  if (typeof s !== "string") return s;
  const exactVar = s.match(/^\$([a-zA-Z0-9_-]+)$/);
  if (exactVar) {
    ctx.__activeCollector?.add(exactVar[1]);
    const val = ctx.vars[exactVar[1]];
    return val !== undefined ? val : s;
  }
  return s.replace(/\\\$|\$([a-zA-Z0-9_-]+)/g, (m, v) => {
    if (m === "\\$") return "$";
    ctx.__activeCollector?.add(v);
    const val = ctx.vars[v];
    return val !== undefined ? String(val) : m;
  });
};

export const toRuntimeValue = (value) => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return value;
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value;
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
  if (typeof value === "object") {
    return JSON.stringify(value);
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
    let result = toRuntimeValue(command(args, ctx));

    if (result && typeof result === "object" && result.__khemControl === "return") {
      return [result];
    }

    if (!isRuntimeValue(result)) {
      throw new Error(
        `Khem Error: Command '${cmdName}' returned unsupported runtime value.`,
      );
    }

    out.push(result);
  }

  return out;
}

export const unwrapControlFlow = (resultList) => {
  if (!Array.isArray(resultList) || !resultList.length) {
    return { hasReturn: false, value: null };
  }
  const maybeControl = resultList[resultList.length - 1];
  if (
    maybeControl &&
    typeof maybeControl === "object" &&
    maybeControl.__khemControl === "return"
  ) {
    return { hasReturn: true, value: maybeControl.value ?? null };
  }
  return { hasReturn: false, value: null };
};

export const render = (ast, ctx) => renderValues(evaluate(ast, ctx), ctx);
