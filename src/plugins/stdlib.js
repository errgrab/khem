import {
  createScope,
  evaluate,
  sub,
  toRuntimeValue,
  unwrapControlFlow,
} from "../core/engine.js";
import { parse, ParseError } from "../core/parser.js";
import { evaluateExpression } from "../core/expr.js";

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

const reduceByOperator = (list, operator, initialValue) => {
  const initial = initialValue ?? (list.length ? list[0] : 0);
  const startIndex = initialValue === undefined ? 1 : 0;
  let acc = initial;
  for (let i = startIndex; i < list.length; i += 1) {
    const value = list[i];
    switch (operator) {
      case "+":
        acc = Number(acc) + Number(value);
        break;
      case "-":
        acc = Number(acc) - Number(value);
        break;
      case "*":
        acc = Number(acc) * Number(value);
        break;
      case "/":
        acc = Number(acc) / Number(value);
        break;
      case "and":
        acc = Boolean(acc) && Boolean(value);
        break;
      case "or":
        acc = Boolean(acc) || Boolean(value);
        break;
      default:
        throw new Error(`Unsupported reduce operator '${operator}'.`);
    }
  }
  return acc;
};

const hasReturnSignal = (values) =>
  Array.isArray(values) &&
  values.some(
    (value) =>
      value && typeof value === "object" && value.__khemControl === "return",
  );

const resolveCondition = (value, ctx) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const condition = sub(value, ctx);
    try {
      return Boolean(evaluateExpression(condition));
    } catch (e) {
      return truthy(condition);
    }
  }
  return truthy(value);
};

export function loadStdLib(env) {
  const c = env.cmds;

  c["set"] = (args, ctx) => {
    const key = String(args[0]);
    if (args.length > 2 && typeof args[1] === "string" && c[args[1]]) {
      ctx.vars[key] = toRuntimeValue(c[args[1]](args.slice(2), ctx));
      return null;
    }
    ctx.vars[key] = args[1] ?? null;
    if (ctx.stateKeys?.has(key)) {
      if (ctx.persistKeys?.has(key) && typeof localStorage !== "undefined") {
        localStorage.setItem(
          `khem:state:${key}`,
          JSON.stringify({ v: ctx.persistVersion ?? 1, data: ctx.vars[key] }),
        );
      }
      ctx.notifyStateChange?.(key);
    }
    return null;
  };

  c["state"] = (args, ctx) => {
    const key = String(args[0]);
    ctx.stateKeys?.add(key);

    if (ctx.persistKeys?.has(key) && typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(`khem:state:${key}`);
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          if (
            parsed &&
            typeof parsed === "object" &&
            Object.hasOwn(parsed, "v") &&
            Object.hasOwn(parsed, "data")
          ) {
            const targetVersion = ctx.persistVersion ?? 1;
            ctx.vars[key] =
              parsed.v === targetVersion
                ? parsed.data
                : ctx.persistMigrate?.(key, parsed.v, parsed.data, targetVersion) ??
                parsed.data;
          } else {
            ctx.vars[key] = parsed;
          }
          return null;
        } catch (e) {
          ctx.vars[key] = raw;
          return null;
        }
      }
    }

    ctx.vars[key] = args[1] ?? null;
    return null;
  };

  c["persist"] = (args, ctx) => {
    const key = String(args[0]);
    ctx.persistKeys?.add(key);
    if (ctx.vars[key] !== undefined && typeof localStorage !== "undefined") {
      localStorage.setItem(
        `khem:state:${key}`,
        JSON.stringify({ v: ctx.persistVersion ?? 1, data: ctx.vars[key] }),
      );
    }
    return null;
  };

  c["persist-config"] = (args, ctx) => {
    if (String(args[0]) !== "version") return null;
    ctx.persistVersion = Number(args[1] ?? 1) || 1;
    return null;
  };

  c["import"] = (args, ctx) => {
    const spec = String(args[0] ?? "");
    if (!spec) return null;

    const moduleId = ctx.resolveModule
      ? ctx.resolveModule(spec, ctx.__currentModule ?? ctx.entryModule ?? "")
      : spec;

    ctx.loadedModules ??= new Set();
    if (ctx.loadedModules.has(moduleId)) return null;

    const source = ctx.readModule?.(moduleId);
    if (typeof source !== "string") {
      throw new Error(`Unable to import module '${spec}' (resolved: ${moduleId}).`);
    }

    ctx.loadedModules.add(moduleId);
    const prevModule = ctx.__currentModule;
    ctx.__currentModule = moduleId;
    try {
      const ast = parse(source);
      return evaluate(ast, ctx);
    } catch (error) {
      if (error instanceof ParseError) {
        throw new Error(
          `${moduleId}:${error.line}:${error.column} ${error.message}`,
        );
      }
      throw error;
    } finally {
      ctx.__currentModule = prevModule;
    }
  };

  c["derive"] = (args, ctx) => {
    const key = String(args[0]);
    const block = args[1];
    if (!Array.isArray(block)) {
      ctx.vars[key] = args[1] ?? null;
      return null;
    }

    const compute = () => {
      const local = createScope(ctx);
      local.__activeCollector = ctx.__activeCollector ?? null;
      const values = evaluate(block, local);
      if (!Array.isArray(values) || values.length === 0) return null;
      return values[values.length - 1] ?? null;
    };

    const collector = new Set();
    ctx.__activeCollector = collector;
    ctx.vars[key] = compute();
    ctx.__activeCollector = null;
    ctx.derivations?.push({ key, compute, deps: collector });
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

  c["expr"] = (args) => {
    if (args.length === 1) {
      return evaluateExpression(args[0]);
    }
    return evaluateExpression(args);
  };

  c["int"] = (args) => Number.parseInt(String(args[0] ?? 0), 10) || 0;
  c["float"] = (args) => Number.parseFloat(String(args[0] ?? 0)) || 0;
  c["bool"] = (args) => {
    const value = String(args[0] ?? "").toLowerCase();
    return value === "true" || value === "1" || value === "yes";
  };
  c["null"] = () => null;

  c["for"] = (args, ctx) => {
    const out = [];
    const vName = String(args[0]);
    const start = asNumber(args[1]);
    const end = asNumber(args[2]);

    for (let i = start; i <= end; i++) {
      const lCtx = createScope(ctx);
      lCtx.vars[vName] = i;
      const iterOut = evaluate(args[3], lCtx);
      out.push(...iterOut);
      if (hasReturnSignal(iterOut)) return out;
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
      const iterOut = evaluate(block, lCtx);
      out.push(...iterOut);
      if (hasReturnSignal(iterOut)) return out;
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

      const result = evaluate(body, pCtx);
      const control = unwrapControlFlow(result);
      if (control.hasReturn) {
        return control.value;
      }
      return result;
    };

    return null;
  };

  c["return"] = (args) => ({
    __khemControl: "return",
    value: args[0] ?? null,
  });

  c["throw"] = (args) => {
    throw new Error(String(args[0] ?? "Khem throw"));
  };

  c["try"] = (args, ctx) => {
    try {
      return evaluate(args[0], ctx);
    } catch (error) {
      if (args[1] !== "catch" || !args[2]) {
        throw error;
      }
      const catchCtx = createScope(ctx);
      catchCtx.vars.error = error?.message ?? String(error);
      return evaluate(args[2], catchCtx);
    }
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
  c["gt"] = (args) => Number(args[0]) > Number(args[1]);
  c["gte"] = (args) => Number(args[0]) >= Number(args[1]);
  c["lt"] = (args) => Number(args[0]) < Number(args[1]);
  c["lte"] = (args) => Number(args[0]) <= Number(args[1]);
  c["not"] = (args) => !truthy(args[0]);

  c["join"] = (args) => {
    const list = args.slice(0, -1).map((a) => (a === null ? "" : String(a)));
    const sep = args.length ? String(args[args.length - 1] ?? "") : "";
    return list.join(sep);
  };

  c["split"] = (args) => String(args[0] ?? "").split(String(args[1] ?? " "));
  c["replace"] = (args) =>
    String(args[0] ?? "").replaceAll(
      String(args[1] ?? ""),
      String(args[2] ?? ""),
    );
  c["trim"] = (args) => String(args[0] ?? "").trim();
  c["upper"] = (args) => String(args[0] ?? "").toUpperCase();
  c["lower"] = (args) => String(args[0] ?? "").toLowerCase();
  c["slice"] = (args) => {
    const value = args[0];
    const start = Number(args[1] ?? 0);
    const end = args[2] === undefined ? undefined : Number(args[2]);
    if (Array.isArray(value)) return value.slice(start, end);
    return String(value ?? "").slice(start, end);
  };
  c["contains"] = (args) => {
    const source = args[0];
    const needle = args[1];
    if (Array.isArray(source)) return source.includes(needle);
    return String(source ?? "").includes(String(needle ?? ""));
  };
  c["starts-with"] = (args) =>
    String(args[0] ?? "").startsWith(String(args[1] ?? ""));
  c["ends-with"] = (args) =>
    String(args[0] ?? "").endsWith(String(args[1] ?? ""));

  c["length"] = (args) => {
    const value = args[0];
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === "object") return Object.keys(value).length;
    return String(value ?? "").length;
  };

  c["push"] = (args) => {
    const list = Array.isArray(args[0]) ? [...args[0]] : [];
    list.push(args[1]);
    return list;
  };

  c["pop"] = (args) => {
    const list = Array.isArray(args[0]) ? [...args[0]] : [];
    list.pop();
    return list;
  };

  c["find"] = (args) => {
    const list = Array.isArray(args[0]) ? args[0] : [];
    const needle = args[1];
    return list.find((item) => item === needle) ?? null;
  };

  c["sort"] = (args) => {
    const list = Array.isArray(args[0]) ? [...args[0]] : [];
    return list.sort((a, b) => String(a).localeCompare(String(b)));
  };

  c["filter"] = (args, ctx) => {
    const list = Array.isArray(args[0]) ? args[0] : [];
    const fnName = String(args[1] ?? "");
    const fn = c[fnName];
    if (!fn) return list;
    return list.filter((item) => truthy(fn([item, ...args.slice(2)], ctx)));
  };

  c["reduce"] = (args) => {
    const list = Array.isArray(args[0]) ? args[0] : [];
    const operator = String(args[1] ?? "+");
    return reduceByOperator(list, operator, args[2]);
  };

  c["today"] = () => new Date().toISOString().slice(0, 10);
  c["year-of"] = (args) => new Date(String(args[0] ?? "")).getFullYear();
  c["month-of"] = (args) => new Date(String(args[0] ?? "")).getMonth() + 1;
  c["day-of"] = (args) => new Date(String(args[0] ?? "")).getDate();
  c["days-in-month"] = (args) => {
    const year = Number(args[0] ?? new Date().getFullYear());
    const month = Number(args[1] ?? new Date().getMonth() + 1);
    return new Date(year, month, 0).getDate();
  };
  c["format-date"] = (args) => {
    const date = new Date(String(args[0] ?? ""));
    const locale = String(args[1] ?? "en-US");
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(locale);
  };

  c["min"] = (args) => Math.min(...args.map((x) => Number(x)));
  c["max"] = (args) => Math.max(...args.map((x) => Number(x)));
  c["abs"] = (args) => Math.abs(Number(args[0] ?? 0));
  c["floor"] = (args) => Math.floor(Number(args[0] ?? 0));
  c["ceil"] = (args) => Math.ceil(Number(args[0] ?? 0));
  c["round"] = (args) => Math.round(Number(args[0] ?? 0));
  c["mod"] = (args) => Number(args[0] ?? 0) % Number(args[1] ?? 1);
  c["clamp"] = (args) => {
    const value = Number(args[0] ?? 0);
    const low = Number(args[1] ?? 0);
    const high = Number(args[2] ?? 0);
    return Math.max(low, Math.min(high, value));
  };
  c["pow"] = (args) => Math.pow(Number(args[0] ?? 0), Number(args[1] ?? 1));

  c["match"] = (args, ctx) => {
    const target = args[0];
    const clauses =
      args.length === 2 && Array.isArray(args[1]) ? args[1] : args.slice(1);
    let fallback = null;

    for (let i = 0; i < clauses.length; i += 1) {
      const clause = clauses[i];
      if (!Array.isArray(clause) || clause.length < 2) continue;
      const [pattern, block] = clause;
      if (pattern === "default") {
        fallback = block;
        continue;
      }
      if (pattern === target) {
        return evaluate(block, ctx);
      }
    }

    if (fallback) return evaluate(fallback, ctx);
    return null;
  };

  c["list"] = (args) => args.map((arg) => toRuntimeValue(arg));

  c["map"] = (args) => {
    if (Array.isArray(args[0]) && typeof args[1] === "string" && c[args[1]]) {
      const list = args[0];
      const fn = c[args[1]];
      return list.map((item) => fn([item, ...args.slice(2)], env));
    }
    const result = {};
    for (let i = 0; i < args.length; i += 2) {
      const key = String(args[i]);
      result[key] = toRuntimeValue(args[i + 1]);
    }
    return result;
  };

  // Explicit rendering command for scripts that need output from typed values.
  c["emit"] = (args) => args[0] ?? null;
}
