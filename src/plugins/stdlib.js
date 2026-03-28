import { createScope, evaluate } from "../core/engine.js";
import { parse } from "../core/parser.js";

const truthy = (v) => v && v !== "0" && v !== "false";
const num = (v) => Number(v) || 0;

export function loadStdLib(env) {
  const c = env.cmds;

  c["text"] = (args) => args[0] ?? "";

  c["set"] = (args, scope) => {
    scope.vars[args[0]] = args[1] ?? "";
    return null;
  };

  c["puts"] = (args) => {
    console.log(args.join(" "));
    return null;
  };

  c["if"] = (args, scope) => {
    const [condition, trueBlock, elseKeyword, falseBlock] = args;
    if (truthy(condition)) return evaluate(parse(trueBlock), scope, env);
    if (elseKeyword === "else" && falseBlock)
      return evaluate(parse(falseBlock), scope, env);
    return null;
  };

  c["for"] = (args, scope) => {
    const [varName, start, end, body] = args;
    const outputs = [];
    const bodyCmds = parse(body);
    const old = scope.vars[varName];
    for (let i = num(start); i <= num(end); i++) {
      scope.vars[varName] = String(i);
      outputs.push(...evaluate(bodyCmds, scope, env));
    }
    if (old !== undefined) scope.vars[varName] = old;
    else delete scope.vars[varName];
    return outputs;
  };

  c["foreach"] = (args, scope) => {
    const [varName, listStr, body] = args;
    const items = String(listStr).split(/\s+/).filter(Boolean);
    const bodyCmds = parse(body);
    const outputs = [];
    const old = scope.vars[varName];
    for (const item of items) {
      scope.vars[varName] = item;
      outputs.push(...evaluate(bodyCmds, local, env));
    }
    if (old !== undefined) scope.vars[varName] = old;
    else delete scope.vars[varName];
    return outputs;
  };

  c["proc"] = (args) => {
    const [name, rawParams, bodyStr] = args;
    const body = parse(bodyStr);
    const params = parse(paramsStr).map((p) =>
      typeof p === "string"
        ? { name: p, default: null }
        : { name: p[0], default: p[1] ?? null },
    );
    c[name] = (callArgs, callScope) => {
      const local = createScope(callScope);
      let argIndex = 0;
      for (const p of params) {
        const value =
          argIndex < callArgs.length
            ? callArgs[argIndex++]
            : (param.default ?? "");
        local.vars[p.name] = value;
      }
      const result = evaluate(body, local, env);
      if (result.length > 0 && result[0]?.__khemReturn) {
        return [result[0].value ?? ""];
      }
      return result;
    };
    return null;
  };

  c["return"] = (args) => ({ __khemReturn: true, value: args[0] ?? "" });

  c["list"] = (args) => args.join(" ");
  c["llength"] = (args) => args[0].split(/\s+/).filter(Boolean).length;
  c["lindex"] = (args) =>
    args[0].split(/\s+/).filter(Boolean)[num(args[1])] ?? "";
  c["lappend"] = (args, scope) => {
    scope.vars[args[0]] =
      (scope.vars[args[0]] || "") + " " + args.slice(1).join(" ");
    return null;
  };
  c["concat"] = (args) => args.join(" ");
  c["join"] = (args) => {
    // If first arg looks like a list (space-separated), join it with separator
    // Otherwise, concatenate all arguments
    if (args.length === 2 && args[0].includes(" ")) {
      return args[0].split(/\s+/).join(args[1] || " ");
    }
    return args.join("");
  };

  c["expr"] = (args, scope) => {
    let expr = args.join(" ");
    expr = expr.replace(/==/g, "===").replace(/!=/g, "!==");
    try {
      return String(new Function("return " + expr)());
    } catch {
      return "0";
    }
  };

  c["incr"] = (args, scope) => {
    scope.vars[args[0]] = String(
      num(scope.vars[args[0]] || 0) + num(args[1] || 1),
    );
    return scope.vars[args[0]];
  };

  c["abs"] = (args) => String(Math.abs(num(args[0])));
  c["round"] = (args) => String(Math.round(num(args[0])));
  c["floor"] = (args) => String(Math.floor(num(args[0])));
  c["ceil"] = (args) => String(Math.ceil(num(args[0])));
  c["sqrt"] = (args) => String(Math.sqrt(num(args[0])));
  c["max"] = (args) => String(Math.max(...args.map(num)));
  c["min"] = (args) => String(Math.min(...args.map(num)));

  c["string"] = (args) => {
    const [op, str, ...rest] = args;
    switch (op) {
      case "length":
        return String(str.length);
      case "index":
        return str[num(rest[0])] || "";
      case "range":
        return str.slice(num(rest[0]), rest[1] ? num(rest[1]) + 1 : undefined);
      case "trim":
        return str.trim();
      case "toupper":
        return str.toUpperCase();
      case "tolower":
        return str.toLowerCase();
      case "match": {
        const re = new RegExp(rest[0].replace(/\*/g, ".*").replace(/\?/g, "."));
        return re.test(str) ? "1" : "0";
      }
      default:
        return "";
    }
  };

  c["eq"] = (args) => (args[0] === args[1] ? "1" : "0");
  c["neq"] = (args) => (args[0] !== args[1] ? "1" : "0");
  c["gt"] = (args) => (num(args[0]) > num(args[1]) ? "1" : "0");
  c["lt"] = (args) => (num(args[0]) < num(args[1]) ? "1" : "0");
  c["gte"] = (args) => (num(args[0]) >= num(args[1]) ? "1" : "0");
  c["lte"] = (args) => (num(args[0]) <= num(args[1]) ? "1" : "0");
  c["not"] = (args) => (truthy(args[0]) ? "0" : "1");
  c["and"] = (args) => (truthy(args[0]) && truthy(args[1]) ? "1" : "0");
  c["or"] = (args) => (truthy(args[0]) || truthy(args[1]) ? "1" : "0");

  c["replace"] = (args) => args[0].replaceAll(args[1], args[2]);
  c["trim"] = (args) => args[0].trim();
  c["upper"] = (args) => args[0].toUpperCase();
  c["lower"] = (args) => args[0].toLowerCase();
  c["slice"] = (args) =>
    args[0].slice(num(args[1]), args[2] ? num(args[2]) : undefined);
  c["contains"] = (args) => (args[0].includes(args[1]) ? "1" : "0");
  c["starts-with"] = (args) => (args[0].startsWith(args[1]) ? "1" : "0");
  c["ends-with"] = (args) => (args[0].endsWith(args[1]) ? "1" : "0");

  c["today"] = () => new Date().toISOString().slice(0, 10);
  c["clock"] = (args) => {
    if (args[0] === "seconds") return String(Math.floor(Date.now() / 1000));
    return new Date().toLocaleString();
  };

  c["match"] = (args, scope) => {
    const target = args[0];

    // Handle different argument formats
    let clauses = [];

    if (args.length === 2 && typeof args[1] === "string") {
      // match $x "{ 1 {...} 2 {...} }" - parse the string
      const clauseStr = args[1];
      const parts = [];
      let i = 0;
      while (i < clauseStr.length) {
        // Skip whitespace
        while (i < clauseStr.length && /\s/.test(clauseStr[i])) i++;
        if (i >= clauseStr.length) break;

        // Get pattern (may be quoted)
        let pattern = "";
        if (clauseStr[i] === '"') {
          i++; // skip opening quote
          while (i < clauseStr.length && clauseStr[i] !== '"') {
            pattern += clauseStr[i];
            i++;
          }
          if (i < clauseStr.length) i++; // skip closing quote
        } else {
          while (i < clauseStr.length && !/[\s{}]/.test(clauseStr[i])) {
            pattern += clauseStr[i];
            i++;
          }
        }

        // Skip whitespace
        while (i < clauseStr.length && /\s/.test(clauseStr[i])) i++;

        // Get body in braces
        if (clauseStr[i] === "{") {
          i++;
          let depth = 1,
            body = "";
          while (i < clauseStr.length && depth > 0) {
            if (clauseStr[i] === "{") depth++;
            if (clauseStr[i] === "}") {
              depth--;
              if (depth === 0) break;
            }
            body += clauseStr[i];
            i++;
          }
          if (i < clauseStr.length) i++; // skip }
          parts.push([pattern.trim(), body.trim()]);
        }
      }
      clauses = parts;
    } else {
      // match $x {pattern1 {body1}} {pattern2 {body2}} ...
      for (let i = 1; i < args.length; i++) {
        if (Array.isArray(args[i]) && args[i].length >= 2) {
          clauses.push(args[i]);
        }
      }
    }

    let fallback = null;
    for (const [pattern, bodyStr] of clauses) {
      const body = parse(bodyStr);
      if (pattern === "default") {
        fallback = body;
        continue;
      }
      if (pattern === target) return evaluate(body, scope, env);
    }
    return fallback ? evaluate(fallback, scope, env) : null;
  };

  c["try"] = (args, scope) => {
    try {
      return evaluate(parse(args[0]), scope, env);
    } catch (e) {
      if (args[1] === "catch" && args[2]) {
        const catchScope = {
          vars: { ...scope.vars, error: e.message },
          parent: scope.parent,
        };
        return evaluate(parse(args[2]), catchScope, env);
      }
      throw e;
    }
  };

  c["throw"] = (args) => {
    throw new Error(args[0]);
  };

  c["dict"] = (args) => {
    const [op, ...rest] = args;
    switch (op) {
      case "create": {
        const pairs = [];
        for (let i = 0; i < rest.length; i += 2)
          pairs.push(rest[i], rest[i + 1] || "");
        return pairs.join(" ");
      }
      case "get": {
        const items = rest[0].split(/\s+/);
        for (let i = 0; i < items.length; i += 2) {
          if (items[i] === rest[1]) return items[i + 1];
        }
        return "";
      }
      case "set": {
        const items = rest[0] ? rest[0].split(/\s+/) : [];
        const key = rest[1],
          val = rest[2];
        let found = false;
        for (let i = 0; i < items.length; i += 2) {
          if (items[i] === key) {
            items[i + 1] = val;
            found = true;
            break;
          }
        }
        if (!found) items.push(key, val);
        return items.join(" ");
      }
      default:
        return "";
    }
  };
}
