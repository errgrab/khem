import { evaluate, sub } from '../core/engine.js';

export function loadWebLib(env) {
  const c = env.cmds;

  // --- INTERACTIVE ACTION REGISTRY ---
  // We attach this to globalThis so the browser (and iframes) can find it natively
  if (!globalThis.khemActions) {
    globalThis.khemActions = {};
    globalThis.khemExecuteAction = (id) => {
      if (globalThis.khemActions[id]) {
        evaluate(globalThis.khemActions[id], env);
      } else {
        console.error(`Khem Action Error: Action '${id}' is missing or expired.`);
      }
    };
  }

  let actionCounter = 0;

  // --- BASIC UI WRAPPERS ---
  c['render'] = (args, ctx) => `<div style="padding: 16px;">${evaluate(args[0], ctx)}</div>`;
  c['ui']     = (args, ctx) => `<div style="display: flex; flex-direction: column; gap: 12px;">${evaluate(args[0], ctx)}</div>`;
  c['panel']  = (args, ctx) => `<div style="border: 1px solid var(--border); background: var(--s1); padding: 12px;">${evaluate(args[0], ctx)}</div>`;
  c['row']    = (args, ctx) => `<div style="display: flex; gap: 12px;">${evaluate(args[0], ctx)}</div>`;
  c['col']    = (args, ctx) => `<div style="display: flex; flex-direction: column; flex: 1; gap: 8px;">${evaluate(args[0], ctx)}</div>`;
  c['box']    = (args, ctx) => `<div style="${args[0]}">${evaluate(args[1], ctx)}</div>`;
  c['label']  = args => `<div style="color: var(--fg2); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">${args[0]}</div>`;
  c['text']   = args => args[0] || "";

  // --- SEMANTIC HTML NODES ---
  const tags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'main', 'header', 'footer', 'nav'];
  
  tags.forEach(tag => {
    c[tag] = (args, ctx) => {
      // args[0] is the class/id, args[1] is the nested block
      return `<${tag} class="${sub(args[0], ctx)}">${evaluate(args[1], ctx)}</${tag}>`;
    };
  });

  c['input'] = (args, ctx) => {
    const type = args[0] || "text";
    const cls = args[1] || "";
    const id = args[2] ? `id="${args[2]}"` : "";
    return `<input type="${type}" class="${cls}" ${id}>`;
  };

  // --- UNIFIED BUTTON (Now supports 'id') ---
  c['button'] = (args, ctx) => {
    let text = "Button", actId = null, cls = "", rawJs = "", domId = "";
    if (Array.isArray(args[0])) {
      args[0].forEach(stmt => {
        if (!stmt || !stmt.length) return;
        if (stmt[0] === 'text') text = sub(stmt[1], ctx);
        if (stmt[0] === 'class') cls = sub(stmt[1], ctx); 
        if (stmt[0] === 'js') rawJs = sub(stmt[1], ctx); 
        if (stmt[0] === 'id') domId = `id="${sub(stmt[1], ctx)}"`; // New!
        if (stmt[0] === 'action') { actId = 'act_' + (++actionCounter); globalThis.khemActions[actId] = stmt[1]; }
      });
    }
    const clickBehavior = rawJs ? `onclick="${rawJs}"` : (actId ? `onclick="window.parent.khemExecuteAction('${actId}')"` : '');
    return `<button ${domId} class="${cls}" ${clickBehavior}>${text}</button>`;
  };
 
  // --- SMART STYLING ENGINE ---
  c['style'] = (args, ctx) => {
    // Mode 1: Global SCSS (1 argument)
    if (args.length === 1) {
      const block = args[0];
      if (Array.isArray(block)) {
        block.forEach(stmt => {
          if (!stmt || stmt.length < 2) return;
          const selector = sub(stmt[0], ctx);
          const rulesBlock = stmt[1];
          
          if (Array.isArray(rulesBlock)) {
            const rules = rulesBlock.filter(s => s && s.length).map(rule => {
              return `${rule[0]}: ${rule.slice(1).map(x => sub(x, ctx)).join(" ")};`;
            }).join(" ");
            ctx.styles.push(`${selector} { ${rules} }`);
          }
        });
      }
      return ""; 
    }
    
    // Mode 2: Inline Wrapper (2 arguments)
    if (args.length === 2) {
      const cssRules = args[0].filter(s => s && s.length).map(stmt => {
        return `${stmt[0]}: ${stmt.slice(1).map(x => sub(x, ctx)).join(" ")};`;
      }).join(" ");
      return `<div style="${cssRules}">${evaluate(args[1], ctx)}</div>`;
    }
    return "";
  };

  // --- THE "FULL STACK" SCRIPT COMMAND ---
  c['script'] = (args, ctx) => {
    if (args[0] === 'src' && args[1]) return `<script src="${sub(args[1], ctx)}"></script>`;
    if (args[0] === 'js' && args[1]) return `<script>\n${args[1]}\n</script>`;
    
    // MODE 3: Client-Side Khem Logic!
    if (Array.isArray(args[0])) {
      ctx.requiresClientRuntime = true; // Tell the document compiler to inject the runtime
      
      // We stringify the AST so the browser doesn't have to parse text!
      const astJson = JSON.stringify(args[0]);
      return `<script>setTimeout(() => Khem.run(${astJson}, Khem.env), 0);</script>`;
    }
    return "";
  };

  // --- FULL DOCUMENT COMPILER ---
  c['document'] = (args, ctx) => {
    const title = sub(args[0], ctx);
    const bodyHtml = evaluate(args[1], ctx);
    const compiledCss = [...new Set(ctx.styles)].join("\n      ");

    const themeVars = `
      :root {
        --bg: #0a0a0a; --s0: #101010; --s1: #161616; --border: #272727;
        --fg: #d4d0c8; --fg1: #aaaaaa; --fg2: #888888; --fg3: #555555;
        --acc: #c8a84b; --mono: 'DM Mono', monospace; --serif: 'Instrument Serif', serif;
      }
    `;

    const clientRuntime = ctx.requiresClientRuntime ? `
    <script>
        /* KHEM CLIENT RUNTIME v1.0 */
        window.Khem = {
          createScope: parent => ({ vars: Object.create(parent.vars), cmds: parent.cmds }),
          sub: (s, ctx) => typeof s === 'string' ? s.replace(/\\\\\\$|\\$([a-zA-Z0-9_-]+)/g, (m,v) => m==='\\\\$' ? '$' : (ctx.vars[v] !== undefined ? ctx.vars[v] : m)) : s,
          run: (ast, ctx) => {
            if (!Array.isArray(ast)) return "";
            return ast.map(stmt => {
              if (!Array.isArray(stmt) || !stmt.length) return "";
              const args = stmt.slice(1).map(arg => Khem.sub(arg, ctx));
              if (ctx.cmds[stmt[0]]) return ctx.cmds[stmt[0]](args, ctx) || "";
              console.error("Khem Client Error: Unknown command '" + stmt[0] + "'"); return "";
            }).join("");
          },
          env: { 
            vars: {}, 
            cmds: {
              'puts': (args) => { console.log(args.join(" ")); return ""; },
              'set': (args, ctx) => { ctx.vars[args[0]] = args[1]; return ""; },
              'if': (args, ctx) => {
                 let isTrue = false; try { isTrue = new Function('return ' + Khem.sub(args[0], ctx))(); } catch(e){}
                 if (isTrue) return Khem.run(args[1], ctx);
                 else if (args[2] === 'else' && args[3]) return Khem.run(args[3], ctx); return "";
              },
              'proc': (args, ctx) => {
                 ctx.cmds[args[0]] = (callArgs, callCtx) => {
                   let pCtx = Khem.createScope(callCtx);
                   args[1].forEach((def, i) => { if(def && def.length) pCtx.vars[def[0]] = callArgs[i] !== undefined ? callArgs[i] : Khem.sub(def[1]||"", pCtx); });
                   return Khem.run(args[2], pCtx);
                 }; return "";
              },
              // DOM MANIPULATION COMMANDS
              'dom_set': (args) => { 
                 const el = document.querySelector(args[0]); if(!el) return "";
                 const props = args[1].split('.'); let t = el;
                 for(let i=0; i<props.length-1; i++) t = t[props[i]];
                 t[props[props.length-1]] = args[2]; return ""; 
              },
              'dom_get': (args, ctx) => {
                 const el = document.querySelector(args[0]); if(!el) return "";
                 const props = args[1].split('.'); let t = el;
                 for(let i=0; i<props.length-1; i++) t = t[props[i]];
                 ctx.vars[args[2]] = t[props[props.length-1]]; return "";
              },
              'dom_on': (args, ctx) => {
                 const el = document.querySelector(args[0]);
                 if(el) el.addEventListener(args[1], () => Khem.run(args[2], ctx)); return "";
              }
            } 
          }
        };
        </script>
    ` : "";

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
    <style>
${themeVars}
      ${compiledCss}
    </style>
    ${clientRuntime}
</head>
<body>
${bodyHtml}
</body>
</html>`;

    if (typeof process !== 'undefined' || typeof window !== 'undefined') {
      console.log("[Khem Compiler] Output generated successfully.");
    }
    return fullHtml;
  };
}
