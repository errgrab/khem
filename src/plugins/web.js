import { evaluate, sub } from "../core/engine.js";

export function loadWebLib(env) {
  const c = env.cmds;

  // --- INTERACTIVE ACTION REGISTRY ---
  if (!globalThis.khemActions) {
    globalThis.khemActions = {};
    globalThis.khemExecuteAction = (id) => {
      if (globalThis.khemActions[id]) {
        evaluate(globalThis.khemActions[id], env);
      } else {
        console.error(`Khem Action Error: Action '${id}' missing.`);
      }
    };
  }

  let actionCounter = 0;

  // --- HELPERS ---
  const renderContent = (val, ctx) => {
    if (Array.isArray(val)) return evaluate(val, ctx);
    return sub(val, ctx) ?? "";
  };

  // --- SEMANTIC UI WRAPPERS ---
  c["render"] = (args, ctx) =>
    `<div style="padding: 1.5rem;">${renderContent(args[0], ctx)}</div>`;
  c["ui"] = (args, ctx) =>
    `<div style="display: flex; flex-direction: column; gap: 0.75rem;">${renderContent(args[0], ctx)}</div>`;
  c["panel"] = (args, ctx) =>
    `<div style="border: 1px solid var(--border); background: var(--s1); padding: 1rem;">${renderContent(args[0], ctx)}</div>`;
  c["row"] = (args, ctx) =>
    `<div style="display: flex; gap: 0.75rem; align-items: center;">${renderContent(args[0], ctx)}</div>`;
  c["col"] = (args, ctx) =>
    `<div style="display: flex; flex-direction: column; flex: 1; gap: 0.5rem;">${renderContent(args[0], ctx)}</div>`;
  c["box"] = (args, ctx) =>
    `<div style="${sub(args[0], ctx)}">${renderContent(args[1], ctx)}</div>`;
  c["label"] = (args, ctx) =>
    `<div style="color: var(--fg2); font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 0.5rem;">${sub(args[0], ctx)}</div>`;
  c["text"] = (args, ctx) => sub(args[0], ctx) || "";

  // --- AUTOMATIC TAG GENERATOR ---
  const tags = [
    "div",
    "span",
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "section",
    "main",
    "header",
    "footer",
    "nav",
    "article",
  ];
  tags.forEach((tag) => {
    c[tag] = (args, ctx) => {
      // If 1 arg: (tag content)
      // If 2 args: (tag class content)
      const hasClass = args.length > 1;
      const classVal = hasClass ? args[0] : "";
      const content = hasClass ? args[1] : args[0];

      const cls = classVal ? ` class="${sub(classVal, ctx)}"` : "";
      return `<${tag}${cls}>${renderContent(content, ctx)}</${tag}>`;
    };
  });

  c["input"] = (args, ctx) => {
    const type = args[0] || "text";
    const cls = args[1] || "";
    const id = args[2] ? `id="${sub(args[2], ctx)}"` : "";
    return `<input type="${type}" class="field ${cls}" ${id}>`;
  };

  c["button"] = (args, ctx) => {
    let text = "Button",
      actId = null,
      cls = "",
      rawJs = "",
      domId = "";
    if (Array.isArray(args[0])) {
      args[0].forEach((stmt) => {
        if (!stmt || !stmt.length) return;
        if (stmt[0] === "text") text = sub(stmt[1], ctx);
        if (stmt[0] === "class") cls = sub(stmt[1], ctx);
        if (stmt[0] === "js") rawJs = sub(stmt[1], ctx);
        if (stmt[0] === "id") domId = `id="${sub(stmt[1], ctx)}"`;
        if (stmt[0] === "action") {
          actId = "act_" + ++actionCounter;
          globalThis.khemActions[actId] = stmt[1];
        }
      });
    }
    const click = rawJs
      ? `onclick="${rawJs}"`
      : actId
        ? `onclick="window.parent.khemExecuteAction('${actId}')"`
        : "";
    return `<button ${domId} class="${cls}" ${click}>${text}</button>`;
  };

  // --- STYLE & SCRIPT ---
  c["style"] = (args, ctx) => {
    if (args.length === 1) {
      // Global Block
      args[0].forEach((stmt) => {
        if (!stmt || stmt.length < 2) return;

        // Multi-word selectors (e.g., .header h1)
        const selector = stmt
          .slice(0, -1)
          .map((s) => sub(s, ctx))
          .join(" ");
        const rulesBlock = stmt[stmt.length - 1];

        if (!Array.isArray(rulesBlock)) return;

        const rules = rulesBlock
          .map(
            (r) =>
              `${r[0]}: ${r
                .slice(1)
                .map((x) => sub(x, ctx))
                .join(" ")};`,
          )
          .join(" ");
        ctx.styles.push(`${selector} { ${rules} }`);
      });
      return "";
    }
    const rules = args[0]
      .map(
        (r) =>
          `${r[0]}: ${r
            .slice(1)
            .map((x) => sub(x, ctx))
            .join(" ")};`,
      )
      .join(" ");
    return `<div style="${rules}">${evaluate(args[1], ctx)}</div>`;
  };

  // --- INTERACTIVE DOM COMMANDS ---
  c["dom_set"] = (args, ctx) => {
    if (typeof document === "undefined") return "";
    const el = document.querySelector(sub(args[0], ctx));
    if (!el) return "";
    const path = sub(args[1], ctx).split(".");
    let t = el;
    for (let i = 0; i < path.length - 1; i++) t = t[path[i]];
    t[path[path.length - 1]] = sub(args[2], ctx);
    return "";
  };

  c["dom_on"] = (args, ctx) => {
    if (typeof document === "undefined") return "";
    const el = document.querySelector(sub(args[0], ctx));
    if (!el) return "";
    const event = sub(args[1], ctx);
    const block = args[2];
    el.addEventListener(event, () => {
      evaluate(block, ctx);
    });
    return "";
  };

  c["script"] = (args, ctx) => {
    if (args[0] === "src")
      return `<script src="${sub(args[1], ctx)}"></script>`;
    if (args[0] === "js") return `<script>${args[1]}</script>`;
    if (Array.isArray(args[0])) {
      ctx.requiresClientRuntime = true;
      return `<script>setTimeout(() => Khem.run(${JSON.stringify(args[0])}, Khem.env), 0);</script>`;
    }
    return "";
  };

  // --- DOCUMENT COMPILER (Design System Integrated) ---
  c["document"] = (args, ctx) => {
    const title = sub(args[0], ctx);
    const bodyHtml = evaluate(args[1], ctx);
    const compiledCss = [...new Set(ctx.styles)].join("\n      ");

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
    <style>
      :root {
        --bg: #0a0a0a; --s0: #101010; --s1: #161616; --surface: #141414; --border: #272727; --b2: #333333;
        --fg: #d4d0c8; --fg1: #aaaaaa; --fg2: #888888; --fg3: #555555; --dim: #484848;
        --acc: #c8a84b; --acc-dim: #7a6628; --green: #6b9e78; --red: #a86b6b; --blue: #7a8fa8;
        --mono: 'DM Mono', monospace; --serif: 'Instrument Serif', serif;
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        background: var(--bg); color: var(--fg); font-family: var(--mono);
        font-size: 12px; line-height: 1.6; -webkit-font-smoothing: antialiased;
      }
      h1, h2, h3 { font-family: var(--serif); font-weight: normal; }
      .field { background: var(--bg); border: 1px solid var(--border); color: var(--fg); padding: 8px 10px; outline: none; transition: 0.15s; font-family: inherit; }
      .field:focus { border-color: var(--acc); }
      button { background: transparent; border: 1px solid var(--border); color: var(--fg1); padding: 4px 12px; cursor: pointer; font-family: inherit; transition: 0.15s; }
      button:hover { border-color: var(--acc); color: var(--fg); }
      ${compiledCss}
    </style>
    ${
      ctx.requiresClientRuntime
        ? `<script>
      window.Khem = {
        createScope: p => ({ vars: Object.create(p.vars), cmds: p.cmds }),
        sub: (s, ctx) => typeof s === 'string' ? s.replace(/\\\\\\$|\\$([a-zA-Z0-9_-]+)/g, (m,v) => v ? (ctx.vars[v] !== undefined ? ctx.vars[v] : m) : '$') : s,
        run: (ast, ctx) => Array.isArray(ast) ? ast.map(s => {
          if(!s || !s.length) return "";
          const args = s.slice(1).map(a => Khem.sub(a, ctx));
          return ctx.cmds[s[0]] ? ctx.cmds[s[0]](args, ctx) : "";
        }).join("") : "",
        env: { vars: {}, cmds: {
          'puts': a => console.log(a.join(" ")),
          'set': (a, ctx) => { ctx.vars[a[0]] = a[1]; },
          'dom_set': a => {
            const el = document.querySelector(a[0]); if(!el) return;
            const p = a[1].split('.'); let t = el;
            for(let i=0; i<p.length-1; i++) t = t[p[i]];
            t[p[p.length-1]] = a[2];
          },
          'dom_get': (a, ctx) => {
            const el = document.querySelector(a[0]); if(!el) return;
            const p = a[1].split('.'); let t = el;
            for(let i=0; i<p.length-1; i++) t = t[p[i]];
            ctx.vars[a[2]] = t[p[p.length-1]];
          },
          'dom_on': (a, ctx) => {
            const el = document.querySelector(a[0]);
            if(el) el.addEventListener(a[1], () => Khem.run(a[2], ctx));
          }
        }}
      };
    </script>`
        : ""
    }
</head>
<body>${bodyHtml}</body>
</html>`;
    return fullHtml;
  };
}
