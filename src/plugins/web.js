import { parse } from "../core/parser.js";
import { evaluate } from "../core/engine.js";
import { DEFAULT_CSS, GOOGLE_FONTS } from "../styles.js";

let _fs = null;
let _path = null;

function isNode() {
  return (
    typeof process !== "undefined" &&
    process.versions != null &&
    process.versions.node != null
  );
}

if (isNode()) {
  Promise.all([
    import("node:fs").catch(() => null),
    import("node:path").catch(() => null),
  ]).then(([fsMod, pathMod]) => {
    if (fsMod) _fs = fsMod.default ?? fsMod;
    if (pathMod) _path = pathMod.default ?? pathMod;
  });
}

export function runWeb(code, env) {
  const scope = { vars: env.vars, parent: null };
  evaluate(parse(code), scope, env);
  return generateHTML(env);
}

const getCtx = (env) => {
  if (!env._web)
    env._web = {
      title: "Khem App",
      pages: {},
      routes: {},
      styles: [],
      scripts: [],
      includes: new Set(),
    };
  return env._web;
};

const renderWeb = (src, scope, env) => {
  if (typeof src !== "string")
    throw new Error("RenderWeb: source must be a string");
  return evaluate(parse(src), scope, env).join("");
};

function tagArgs(args, scope, env) {
  if (args.length < 1 || args.length > 2)
    throw new Error("tag expects 1 or 2 arguments");

  const hasClass = args.length === 2;
  const className = hasClass ? args[0] : "";
  const bodyRaw = hasClass ? args[1] : args[0];

  return {
    cls: className ? ` class="${className}"` : "",
    body: renderWeb(bodyRaw, scope, env),
  };
}

export function loadWebLib(env) {
  const c = env.cmds;
  const ctx = getCtx(env);

  const makeTag = (tag) => (args, scope) => {
    const { cls, body } = tagArgs(args, scope, env);
    return `<${tag}${cls}>${body}</${tag}>`;
  };

  c["title"] = ([t]) => {
    ctx.title = t ?? "Khem App";
  };
  c["page"] = ([name, body]) => {
    ctx.pages[name] = body ?? "";
  };
  c["route"] = ([path, page]) => {
    ctx.routes[path] = page;
  };
  c["style"] = ([s]) => {
    if (s) ctx.styles.push(s);
  };
  c["script"] = ([s]) => {
    if (s) ctx.scripts.push(s);
  };
  c["text"] = ([t]) => t ?? "";

  c["document"] = ([title, body]) => {
    if (title) ctx.title = title;
    ctx.pages["__doc__"] = body ?? "";
    ctx.routes["#/"] = "__doc__";
  };

  c["include"] = ([file], scope) => {
    if (!file) return;
    if (!isNode()) {
      console.warn(
        `include "${file}" skipped — filesystem not available in browser`,
      );
      return;
    }
    if (!_fs || !_path) {
      console.error(
        `include "${file}" skipped — Node builtins not yet initialised`,
      );
      return;
    }
    const base = env._baseDir ?? process.cwd();
    const abs = _path.resolve(base, file);
    if (ctx.includes.has(abs)) return;
    ctx.includes.add(abs);
    const prev = env._baseDir;
    try {
      env._baseDir = _path.dirname(abs);
      renderWeb(_fs.readFileSync(abs, "utf8"), scope, env);
    } catch (e) {
      console.error(`include error: ${e.message}`);
    } finally {
      env._baseDir = prev;
    }
  };

  [
    "div",
    "span",
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "table",
    "tr",
    "td",
    "th",
    "section",
    "main",
    "header",
    "footer",
    "nav",
    "article",
    "form",
    "label",
    "pre",
    "code",
    "blockquote",
    "strong",
    "em",
  ].forEach((tag) => {
    c[tag] = makeTag(tag);
  });

  c["a"] = (args, scope) => {
    const href = args[0] ?? "#";
    const { cls, body } = tagArgs(args.slice(1), scope, env);
    return `<a href="${href}"${cls}>${body}</a>`;
  };

  c["button"] = (args, scope) => {
    const { cls, body } = tagArgs(args, scope, env);
    return `<button${cls}>${body}</button>`;
  };

  c["input"] = (args) => {
    let id = "",
      cls = "field",
      attrsStr = "";
    if (args.length === 1) {
      attrsStr = args[0];
    } else if (args.length === 2) {
      cls = args[0];
      attrsStr = args[1];
    } else if (args.length >= 3) {
      id = args[0];
      cls = args[1];
      attrsStr = args[2];
    }
    const parsedAttrs = attrsStr
      ? parse(attrsStr)
          .map(([k, ...v]) => (v.length ? `${k}="${v.join(" ")}"` : k))
          .join(" ")
      : "";
    return `<input${id ? ` id="${id}"` : ""}${cls ? ` class="${cls}"` : ""}${parsedAttrs ? ` ${parsedAttrs}` : ""}>`;
  };

  c["br"] = () => "<br>";
  c["hr"] = () => "<hr>";
  c["img"] = ([src = "", alt = ""]) => `<img src="${src}" alt="${alt}">`;
}

export function generateHTML(env) {
  const ctx = getCtx(env);

  const pages = {};
  for (const [name, body] of Object.entries(ctx.pages)) {
    const scope = { vars: { ...env.vars }, parent: null };
    pages[name] = renderWeb(body, scope, env);
  }

  const pageNames = Object.keys(pages);
  const defaultPage = ctx.routes["#/"] ?? pageNames[0];
  const initial = pages[defaultPage] ?? "";

  const needsRouting = pageNames.length > 1;
  const routingJS = needsRouting
    ? `
    var T=${JSON.stringify(pages)};
    var R=${JSON.stringify(ctx.routes)};
    function route(){
      var p=R[location.hash||"#/"]||Object.keys(T)[0];
      if(p&&T[p])document.getElementById("app").innerHTML=T[p];
    }
    window.addEventListener("hashchange",route);route();`
    : "";

  const userStyles = ctx.styles.join("\n");
  const userScripts = ctx.scripts.join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ctx.title}</title>
  <link href="${GOOGLE_FONTS}" rel="stylesheet">
  <style>
    ${DEFAULT_CSS}
    ${userStyles}
  </style>
</head>
<body>
  <div id="app">${initial}</div>
  <script>
    ${routingJS}
    ${userScripts}
  <\/script>
</body>
</html>`;
}
