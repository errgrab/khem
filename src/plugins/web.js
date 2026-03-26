import { parse } from "../core/parser.js";
import { evaluate, sub } from "../core/engine.js";
import fs from "node:fs";
import path from "node:path";

let webState = {};
let webPages = {};
let webRoutes = {};
let webStyles = [];
let webTitle = "Khem App";
let webIncludes = new Set();
let actionCounter = 0;
let webActions = {};

export function resetWebState() {
  webState = {};
  webPages = {};
  webRoutes = {};
  webStyles = [];
  webTitle = "Khem App";
  webIncludes = new Set();
  actionCounter = 0;
  webActions = {};
}

export function loadWebLib(env) {
  const c = env.cmds;

  c["state"] = (args, scope) => {
    const name = args[0];
    const value = args[1] ?? "";
    if (!(name in webState)) webState[name] = value;
    scope.vars[name] = webState[name];
    return null;
  };

  c["set"] = (args, scope) => {
    scope.vars[args[0]] = args[1] ?? "";
    return null;
  };

  c["page"] = (args, scope, env, rawArgs) => {
    webPages[args[0]] = rawArgs?.[1] ?? args[1] ?? "";
    return null;
  };

  c["route"] = (args) => {
    webRoutes[args[0]] = args[1];
    return null;
  };

  c["title"] = (args) => {
    webTitle = args[0] ?? "Khem App";
    return null;
  };

  c["include"] = (args, scope, env) => {
    const filePath = args[0];
    if (!filePath) return null;
    const baseDir = env._baseDir || process.cwd();
    const absPath = path.resolve(baseDir, filePath);
    if (webIncludes.has(absPath)) return null;
    webIncludes.add(absPath);
    try {
      const code = fs.readFileSync(absPath, "utf8");
      const origBase = env._baseDir;
      env._baseDir = path.dirname(absPath);
      evaluate(parse(code), { vars: env.vars, parent: null }, env);
      env._baseDir = origBase;
    } catch (e) {
      console.error(`Khem include error: ${e.message}`);
    }
    return null;
  };

  c["style"] = (args, scope, env, rawArgs) => {
    const css = rawArgs?.[0] ?? args[0];
    if (typeof css === "string") webStyles.push(parseKhemCSS(css));
    return null;
  };

  // Text content - preserve $var for client-side reactivity
  c["text"] = (args, scope, env, rawArgs) => {
    // Use rawArgs to preserve $var for client-side substitution
    const content = rawArgs?.[0] ?? args[0] ?? "";
    if (typeof content === "string") return content;
    return String(content);
  };

  // HTML tags
  ["div","span","p","h1","h2","h3","h4","h5","h6","ul","ol","li",
   "table","tr","td","th","section","main","header","footer","nav",
   "article","form","label","pre","code","blockquote","strong","em"].forEach(tag => {
    c[tag] = (args, scope, env) => {
      const cls = args[0] ?? "";
      const content = args[1] ?? "";
      const clsAttr = cls ? ` class="${sub(cls, scope)}"` : "";
      const rendered = renderInner(content, scope, env);
      return `<${tag}${clsAttr}>${rendered}</${tag}>`;
    };
  });

  // Button with action
  c["button"] = (args, scope, env, rawArgs) => {
    const cls = args[0] ?? "";
    const content = args[1] ?? "";
    const actionStr = rawArgs?.[2];
    const clsAttr = cls ? ` class="${sub(cls, scope)}"` : "";
    const rendered = renderInner(content, scope, env);
    if (actionStr && typeof actionStr === "string") {
      const actId = "act_" + (++actionCounter);
      webActions[actId] = actionStr.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g, "{{$1}}");
      return `<button${clsAttr} onclick="khemAct('${actId}')">${rendered}</button>`;
    }
    return `<button${clsAttr}>${rendered}</button>`;
  };

  // Link
  c["a"] = (args, scope, env) => {
    const href = args[0] ?? "#";
    const cls = args[1] ?? "";
    const content = args[2] ?? "";
    const clsAttr = cls ? ` class="${sub(cls, scope)}"` : "";
    return `<a href="${sub(href, scope)}"${clsAttr}>${renderInner(content, scope, env)}</a>`;
  };

  // Input with optional binding
  c["input"] = (args, scope) => {
    const bind = args[0] ?? "";
    const cls = args[1] ?? "";
    const attrs = args[2] ?? "";
    
    let clsAttr = cls ? ` class="${sub(cls, scope)}"` : "";
    let bindAttr = "";
    let valueAttr = "";
    
    if (bind) {
      const val = scope.vars[bind] ?? webState[bind] ?? "";
      bindAttr = ` data-bind="${bind}"`;
      valueAttr = ` value="${sub(val, scope)}"`;
      if (!cls) clsAttr = ` class="field"`;
    }
    
    const attrStr = attrs ? ` ${sub(attrs, scope)}` : "";
    return `<input${clsAttr}${bindAttr}${valueAttr}${attrStr}>`;
  };

  c["br"] = () => "<br>";
  c["hr"] = () => "<hr>";
}

function renderInner(content, scope, env) {
  if (typeof content === "string") {
    return evaluate(parse(content), scope, env).join("");
  }
  return sub(String(content || ""), scope);
}

function parseKhemCSS(str) {
  let output = "";
  const lines = str.split("\n").map(l => l.trim()).filter(Boolean);
  let selector = "", props = [];
  for (const line of lines) {
    if (line.endsWith("{")) { selector = line.slice(0, -1).trim(); props = []; }
    else if (line === "}") { if (selector && props.length) output += `${selector} { ${props.join(" ")} }\n`; selector = ""; }
    else if (line) props.push(line.endsWith(";") ? line : line + ";");
  }
  return output;
}

const DEFAULT_CSS = `:root {
  --bg: #0a0a0a;
  --s0: #101010;
  --s1: #161616;
  --s2: #1e1e1e;
  --s3: #262626;
  --border: #272727;
  --b2: #333333;
  --fg: #d4d0c8;
  --fg1: #aaaaaa;
  --fg2: #888888;
  --fg3: #555555;
  --dim: #484848;
  --acc: #c8a84b;
  --acc-dim: #7a6628;
  --green: #6b9e78;
  --green-dim: #2a4a33;
  --red: #a86b6b;
  --red-dim: #4a2222;
  --blue: #7a8fa8;
  --blue-dim: #2a3a4a;
  --amber: #d4924a;
  --mono: 'DM Mono', 'Fira Mono', ui-monospace, monospace;
  --serif: 'Instrument Serif', Georgia, serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { height: 100%; }
body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: var(--serif); font-weight: normal; }
h4, h5, h6 { font-family: var(--mono); font-weight: 500; }
p { color: var(--fg1); }
a { color: var(--acc); text-decoration: none; }
a:hover { text-decoration: underline; }
code { color: var(--acc); font-size: 10.5px; }
button {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--fg2);
  padding: 4px 12px;
  cursor: pointer;
  font-family: inherit;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: all 0.15s;
}
button:hover { border-color: var(--b2); color: var(--fg); }
button.primary { border-color: var(--acc); color: var(--acc); }
button.primary:hover { border-color: var(--acc); color: var(--fg); }
button.danger:hover { border-color: var(--red); color: var(--red); }
.field {
  background: var(--s1);
  border: 1px solid var(--border);
  color: var(--fg);
  padding: 8px 10px;
  font-family: inherit;
  font-size: 12px;
  outline: none;
  transition: all 0.15s;
}
.field:focus { border-color: var(--acc); }
.field::placeholder { color: var(--fg3); }
textarea.field { resize: vertical; min-height: 60px; }
select.field { cursor: pointer; }
.badge {
  font-size: 9.5px;
  padding: 1px 6px;
  border: 1px solid;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.dot.active { background: var(--acc); }
.dot.done { background: var(--green); }
.dot.blocked { background: var(--red); }
.dot.idle { background: var(--border); }
.panel {
  border: 1px solid var(--border);
  background: var(--s1);
  padding: 1rem;
}
.modal {
  border: 1px solid var(--border);
  background: var(--s2);
  padding: 12px;
}
.toast {
  border: 1px solid var(--green-dim);
  background: #0e1a10;
  color: var(--green);
  padding: 6px 10px;
  display: inline-flex;
}
.table { width: 100%; border-collapse: collapse; }
.table th, .table td {
  border-bottom: 1px solid var(--border);
  padding: 6px 8px;
  text-align: left;
}
.table th { color: var(--fg2); font-weight: normal; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; }
`;

export function generateHTML(env, code) {
  const css = DEFAULT_CSS + webStyles.join("\n");
  
  // Render pages to HTML, then convert $var to {{var}} for client-side reactivity
  const htmlTemplates = {};
  for (const [name, pageBody] of Object.entries(webPages)) {
    const scope = { vars: { ...webState }, parent: null };
    const rendered = evaluate(parse(pageBody), scope, env).join("");
    // Convert $var to {{var}} in the rendered HTML
    htmlTemplates[name] = rendered.replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g, "{{$1}}");
  }
  
  // Get default page
  const firstRoute = Object.keys(webRoutes)[0];
  const defaultPage = firstRoute ? webRoutes[firstRoute] : Object.keys(htmlTemplates)[0];
  const initialHtml = defaultPage ? htmlTemplates[defaultPage] : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${webTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  <div id="app">${initialHtml}</div>
  <script>
    var S = ${JSON.stringify(webState)};
    var T = ${JSON.stringify(htmlTemplates)};
    var R = ${JSON.stringify(webRoutes)};
    var A = ${JSON.stringify(webActions)};

    function sub(s) {
      if (typeof s !== "string") return s;
      return s.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g, function(m, k) {
        return S[k] !== undefined ? S[k] : m;
      });
    }

    function render() {
      var hash = location.hash || "#/";
      var page = R[hash] || Object.keys(T)[0];
      if (!page || !T[page]) return;
      document.getElementById("app").innerHTML = sub(T[page]);
      bindInputs();
    }

    function bindInputs() {
      document.querySelectorAll("[data-bind]").forEach(function(el) {
        var key = el.dataset.bind;
        if (S[key] !== undefined) el.value = S[key];
        el.oninput = function() {
          S[key] = el.value;
          render();
        };
      });
    }

    function khemAct(id) {
      var act = A[id];
      if (!act) return;

      var lines = act.split("\\n");
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;

        var m = line.match(/^set\\s+(\\S+)\\s+(.+)$/);
        if (!m) continue;

        var name = m[1];
        var val = m[2].trim();

        var em = val.match(/^\\[(.+)\\]$/);
        if (em) {
          var inner = em[1];
          if (inner.startsWith("expr ")) {
            var expr = inner.slice(5).replace(/\\{\\{([a-zA-Z_][a-zA-Z0-9_]*)\\}\\}/g, function(_, k) {
              return S[k] || "0";
            });
            try { S[name] = String(eval(expr)); } catch(e) { S[name] = "0"; }
          }
        } else {
          val = val.replace(/^"|"$/g, "");
          S[name] = sub(val);
        }
      }
      render();
    }

    window.khemAct = khemAct;
    window.addEventListener("hashchange", render);
    render();
  </script>
</body>
</html>`;
}
