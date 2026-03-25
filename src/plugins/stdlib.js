import { createScope, evaluate, sub, toRuntimeValue } from "../core/engine.js";

const truthy = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).length > 0;
};

const asNumber = (value) => {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
};

const resolveCondition = (value, ctx) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const condition = sub(value, ctx);
    try {
      return Boolean(new Function("return " + condition)());
    } catch (e) {
      return truthy(condition);
    }
  }
  return truthy(value);
};

export function loadStdLib(env) {
  const c = env.cmds;

  c["set"] = (args, ctx) => {
    ctx.vars[String(args[0])] = args[1] ?? null;
    return null;
  };

  c["puts"] = (args) => {
    console.log(args.map((a) => (a === null ? "" : String(a))).join(" "));
    return null;
  };

  c["if"] = (args, ctx) => {
    const condition = resolveCondition(args[0], ctx);
    if (condition) return evaluate(args[1], ctx);
    if (args[2] === "else" && args[3]) return evaluate(args[3], ctx);
    return null;
  };

  c["for"] = (args, ctx) => {
    const out = [];
    const vName = String(args[0]);
    const start = asNumber(args[1]);
    const end = asNumber(args[2]);

    for (let i = start; i <= end; i++) {
      const lCtx = createScope(ctx);
      lCtx.vars[vName] = i;
      out.push(...evaluate(args[3], lCtx));
    }

    return out;
  };

  c["foreach"] = (args, ctx) => {
    const vName = String(args[0]);
    const block = args[2];
    const items = Array.isArray(args[1])
      ? args[1].map((item) => toRuntimeValue(item))
      : String(args[1] ?? "")
          .split(" ")
          .map((item) => item.trim())
          .filter(Boolean);

    const out = [];
    for (const item of items) {
      const lCtx = createScope(ctx);
      lCtx.vars[vName] = item;
      out.push(...evaluate(block, lCtx));
    }

    return out;
  };

  c["proc"] = (args) => {
    const name = String(args[0]);
    const paramsBlock = args[1];
    const body = args[2];

    c[name] = (callArgs, callCtx) => {
      const pCtx = createScope(callCtx);
      let realParams = [];

      if (Array.isArray(paramsBlock)) {
        if (
          paramsBlock.length > 0 &&
          Array.isArray(paramsBlock[0]) &&
          Array.isArray(paramsBlock[0][0])
        ) {
          realParams = paramsBlock[0];
        } else {
          realParams = paramsBlock;
        }
      }

      realParams.forEach((stmt, i) => {
        if (!Array.isArray(stmt)) return;
        const first = stmt[0];
        if (Array.isArray(first)) {
          const vName = first[0];
          const vDefault = first[1] || "";
          pCtx.vars[vName] =
            callArgs[i] !== undefined ? callArgs[i] : sub(vDefault, pCtx);
        } else {
          pCtx.vars[first] = callArgs[i] !== undefined ? callArgs[i] : null;
        }
      });

      return evaluate(body, pCtx);
    };

    return null;
  };

  c["js"] = (args, ctx) => {
    try {
      const res = new Function("ctx", "return " + sub(args[0], ctx))(ctx);
      return toRuntimeValue(res);
    } catch (e) {
      return null;
    }
  };

  c["math"] = (args, ctx) => {
    try {
      return asNumber(new Function("ctx", "return " + sub(args[0], ctx))(ctx));
    } catch (e) {
      return 0;
    }
  };

  c["date"] = (args, ctx) => {
    const cmd = args[0];
    if (cmd === "now") return Date.now();
    if (cmd === "format") {
      const d = new Date(asNumber(sub(args[1], ctx)));
      return d.toLocaleDateString();
    }
    return null;
  };

  c["ls_set"] = (args, ctx) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        String(sub(args[0], ctx)),
        String(sub(args[1], ctx)),
      );
    }
    return null;
  };

  c["ls_get"] = (args, ctx) => {
    if (typeof localStorage !== "undefined") {
      const val = localStorage.getItem(String(sub(args[0], ctx)));
      ctx.vars[String(args[1])] = val ?? null;
    }
    return null;
  };

  c["eq"] = (args) => args[0] === args[1];
  c["not"] = (args) => !truthy(args[0]);

  c["join"] = (args) => {
    const list = args.slice(0, -1).map((a) => (a === null ? "" : String(a)));
    const sep = args.length ? String(args[args.length - 1] ?? "") : "";
    return list.join(sep);
  };

  // Explicit rendering command for scripts that need output from typed values.
  c["emit"] = (args) => args[0] ?? null;
}
