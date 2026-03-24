import { createScope, evaluate, sub } from '../core/engine.js';

export function loadStdLib(env) {
  const c = env.cmds;

  c['set'] = (args, ctx) => { ctx.vars[args[0]] = args[1]; return ""; };
  c['puts'] = (args, ctx) => { console.log(args.join(" ")); return ""; };

  c['if'] = (args, ctx) => {
    const condition = sub(args[0], ctx);
    let isTrue = false;
    try { isTrue = new Function('return ' + condition)(); } catch (e) {}
    if (isTrue) return evaluate(args[1], ctx);
    else if (args[2] === 'else' && args[3]) return evaluate(args[3], ctx);
    return "";
  };

  c['for'] = (args, ctx) => {
    let out = "", vName = args[0];
    let start = parseInt(sub(args[1], ctx)), end = parseInt(sub(args[2], ctx));
    for (let i = start; i <= end; i++) {
      let lCtx = createScope(ctx);
      lCtx.vars[vName] = i.toString();
      out += evaluate(args[3], lCtx);
    }
    return out;
  };

c['foreach'] = (args, ctx) => {
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

  c['proc'] = (args, ctx) => {
    c[args[0]] = (callArgs, callCtx) => {
      let pCtx = createScope(callCtx);
      args[1].forEach((def, i) => {
        if (def && def.length) pCtx.vars[def[0]] = callArgs[i] !== undefined ? callArgs[i] : sub(def[1] || "", pCtx);
      });
      return evaluate(args[2], pCtx);
    };
    return "";
  };
}
