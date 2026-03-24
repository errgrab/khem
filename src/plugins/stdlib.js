import { createScope, evaluate, sub } from "../core/engine.js";

export function loadStdLib(env) {
  const c = env.cmds;

  c["set"] = (args, ctx) => {
    ctx.vars[args[0]] = args[1];
    return "";
  };
  c["puts"] = (args, ctx) => {
    console.log(args.join(" "));
    return "";
  };

  c["if"] = (args, ctx) => {
    const condition = sub(args[0], ctx);
    let isTrue = false;
    try {
      isTrue = new Function("return " + condition)();
    } catch (e) {}
    if (isTrue) return evaluate(args[1], ctx);
    else if (args[2] === "else" && args[3]) return evaluate(args[3], ctx);
    return "";
  };

  c["for"] = (args, ctx) => {
    let out = "",
      vName = args[0];
    let start = parseInt(sub(args[1], ctx)),
      end = parseInt(sub(args[2], ctx));
    for (let i = start; i <= end; i++) {
      let lCtx = createScope(ctx);
      lCtx.vars[vName] = i.toString();
      out += evaluate(args[3], lCtx);
    }
    return out;
  };

  c["foreach"] = (args, ctx) => {
    const vName = args[0];
    const rawItems = sub(args[1], ctx);
    const items = rawItems.split(" ");
    const block = args[2];
    let out = "";

    for (let item of items) {
      const trimmed = item.trim();
      if (!trimmed) continue;

      let lCtx = createScope(ctx);
      lCtx.vars[vName] = trimmed;

      out += evaluate(block, lCtx);
    }
    return out;
  };

  c["proc"] = (args, ctx) => {
    const name = args[0];
    const paramsBlock = args[1];
    const body = args[2];

    c[name] = (callArgs, callCtx) => {
      let pCtx = createScope(callCtx);
      // Determine the real list of parameters
      let realParams = [];
      if (Array.isArray(paramsBlock)) {
        // If the FIRST statement in the block is itself a block, we might have { {p1 d1} {p2 d2} }
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
          pCtx.vars[first] = callArgs[i] !== undefined ? callArgs[i] : "";
        }
      });

      return evaluate(body, pCtx);
    };
    return "";
  };

  // --- UTILS ---
  c["js"] = (args, ctx) => {
    try {
      const res = new Function("ctx", "return " + sub(args[0], ctx))(ctx);
      return res !== undefined ? res.toString() : "";
    } catch (e) {
      return "";
    }
  };

  c["math"] = (args, ctx) => {
    try {
      return new Function("ctx", "return " + sub(args[0], ctx))(ctx).toString();
    } catch (e) {
      return "0";
    }
  };

  c["date"] = (args, ctx) => {
    const cmd = args[0];
    if (cmd === "now") return Date.now().toString();
    if (cmd === "format") {
      const d = new Date(parseInt(sub(args[1], ctx)));
      return d.toLocaleDateString();
    }
    return "";
  };

  c["ls_set"] = (args, ctx) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(sub(args[0], ctx), sub(args[1], ctx));
    }
    return "";
  };

  c["ls_get"] = (args, ctx) => {
    if (typeof localStorage !== "undefined") {
      const val = localStorage.getItem(sub(args[0], ctx));
      ctx.vars[args[1]] = val || "";
    }
    return "";
  };

  c["eq"] = (args, ctx) =>
    sub(args[0], ctx) === sub(args[1], ctx) ? "true" : "";
  c["not"] = (args, ctx) => (sub(args[0], ctx) ? "" : "true");

  c["join"] = (args, ctx) => {
    const list = args.slice(0, -1).map((a) => sub(a, ctx));
    const sep = sub(args[args.length - 1], ctx);
    return list.join(sep);
  };
}
