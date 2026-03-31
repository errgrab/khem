#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import readline from "node:readline";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  run,
  renderForWeb,
  createEnvironment,
  processScriptTags,
} from "../src/index.js";

const [, , cmd, ...args] = process.argv;

const printError = (error, file = "<stdin>") => {
  console.error(error?.stack || String(error));
};

const isWebFile = (code) => {
  return (
    /^\s*(document|page|route|state|title|style|div|span|p|h[1-6]|button|section|main|header|footer|nav|article|form|ul|ol|table|a|elem)\b/m.test(code) ||
    code.includes('<script type="text/khem">')
  );
};

const compileFile = (filePath, forceWeb = false) => {
  const absPath = path.resolve(filePath);
  const code = fs.readFileSync(absPath, "utf8");
  const baseDir = path.dirname(absPath);

  // Check if it's a web file or forced web mode
  if (forceWeb || isWebFile(code)) {
    return renderForWeb(code, baseDir);
  }

  // Check if it's an HTML file with khem script tags
  if (
    filePath.endsWith(".html") ||
    code.includes('<script type="text/khem">')
  ) {
    return processScriptTags(code);
  }

  return run(code);
};

const startRepl = () => {
  const env = createEnvironment();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "khem> ",
  });

  console.log("Khem REPL — enter Khem code, Ctrl+C to exit.");
  rl.prompt();

  rl.on("line", (line) => {
    const src = line.trim();
    if (!src) {
      rl.prompt();
      return;
    }

    try {
      const output = run(src, env);
      if (output.trim()) console.log(output);
    } catch (error) {
      printError(error);
    }

    rl.prompt();
  });
};

const watchFile = (filePath, forceWeb = false) => {
  const absPath = path.resolve(filePath);
  const ext =
    forceWeb || isWebFile(fs.readFileSync(absPath, "utf8")) ? ".html" : ".txt";
  const outPath = absPath.replace(/\.[^.]+$/, ext);

  const build = () => {
    try {
      const output = compileFile(absPath, forceWeb);
      fs.writeFileSync(outPath, output, "utf8");
      console.log(
        `[khem] rebuilt ${path.basename(outPath)} at ${new Date().toISOString()}`,
      );
    } catch (error) {
      printError(error, absPath);
    }
  };

  build();
  fs.watch(absPath, () => {
    build();
  });

  console.log(`[khem] watching ${absPath}`);
};

const serveFile = (filePath, port = 4173, forceWeb = false) => {
  const absPath = path.resolve(filePath);
  const clients = new Set();

  const sendReload = () => {
    for (const res of clients) {
      res.write("data: reload\n\n");
    }
  };

  fs.watch(absPath, () => sendReload());

  const server = http.createServer((req, res) => {
    if (req.url === "/__khem_events") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write("\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }

    // Serve khem-runtime.js
    if (req.url === "/khem-runtime.js") {
      const runtimePath = path.resolve(__dirname, "..", "khem-runtime.js");
      try {
        const runtimeCode = fs.readFileSync(runtimePath, "utf8");
        res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
        res.end(runtimeCode);
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("khem-runtime.js not found — run: npm run build:runtime");
      }
      return;
    }

    try {
      let output = compileFile(absPath, forceWeb);

      // Inject live reload script
      const reloadScript = `<script>const es=new EventSource('/__khem_events');es.onmessage=(e)=>{if(e.data==='reload')location.reload();};</script>`;

      if (output.includes("</body>")) {
        output = output.replace("</body>", `${reloadScript}</body>`);
      } else {
        output += reloadScript;
      }

      const contentType = output.startsWith("<!DOCTYPE")
        ? "text/html"
        : "text/plain";
      res.writeHead(200, { "Content-Type": `${contentType}; charset=utf-8` });
      res.end(output);
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(String(error?.stack || error));
    }
  });

  server.listen(port, () => {
    console.log(`[khem] serving ${absPath} at http://localhost:${port}`);
  });
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".map": "application/octet-stream",
};

function serveStaticDir(dirPath, port = 4173, host = "127.0.0.1", open = true) {
  const root = path.resolve(dirPath);

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let filePath = urlPath === "/" ? "/ide.html" : urlPath;
    const safePath = path.normalize(path.join(root, filePath));
    if (!safePath.startsWith(root)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    fs.stat(safePath, (err, stat) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }
      if (stat.isDirectory()) {
        const index = path.join(safePath, "index.html");
        if (fs.existsSync(index)) {
          serveFileContent(index, res);
          return;
        }
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Forbidden");
        return;
      }
      serveFileContent(safePath, res);
    });
  });

  function serveFileContent(absPath, res) {
    const ext = path.extname(absPath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-cache",
    });
    const stream = fs.createReadStream(absPath);
    stream.pipe(res);
    stream.on("error", () => {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Server error");
    });
  }

  server.listen(port, host, () => {
    const url = `http://${host}:${port}/ide.html`;
    console.log(`[khem] static server serving ${root} at ${url}`);
    if (open) {
      const opener =
        process.platform === "darwin"
          ? "open"
          : process.platform === "win32"
            ? "start"
            : "xdg-open";
      try {
        if (process.platform === "win32") {
          spawn("cmd", ["/c", "start", "", url], {
            stdio: "ignore",
            detached: true,
          });
        } else {
          spawn(opener, [url], { stdio: "ignore", detached: true }).unref();
        }
      } catch (e) {
        // Ignore errors from trying to open the browser
      }
    }
  });
}

const runTestSuite = () => {
  const parserSuite = spawn(process.execPath, ["tests/parser_test.js"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  parserSuite.on("exit", (code) => {
    if (code !== 0) { process.exit(code ?? 1); return; }

    const stdlibSuite = spawn(process.execPath, ["tests/stdlib_test.js"], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    stdlibSuite.on("exit", (code2) => {
      if (code2 !== 0) { process.exit(code2 ?? 1); return; }

      const webSuite = spawn(process.execPath, ["tests/web_test.js"], {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      webSuite.on("exit", (code3) => {
        process.exit(code3 ?? 1);
      });
    });
  });
};

// CLI Commands
if (cmd === "test") {
  runTestSuite();
} else if (cmd === "repl") {
  startRepl();
} else if (cmd === "watch") {
  const target = args[0];
  if (!target) {
    console.error("Usage: khem watch <file.kh>");
    process.exit(1);
  }
  const forceWeb = args.includes("--web");
  watchFile(target, forceWeb);
} else if (cmd === "build") {
  const target = args[0];
  if (!target) {
    console.error("Usage: khem build <file.kh> [--web]");
    process.exit(1);
  }

  try {
    const forceWeb = args.includes("--web");
    const output = compileFile(target, forceWeb);
    process.stdout.write(output);
  } catch (error) {
    printError(error, target);
    process.exit(1);
  }
} else if (cmd === "serve") {
  const target = args[0];
  const portArg = Number(args[1] ?? 4173);
  if (!target) {
    console.error("Usage: khem serve <file.kh> [port]");
    process.exit(1);
  }
  const forceWeb = args.includes("--web");
  serveFile(target, Number.isFinite(portArg) ? portArg : 4173, forceWeb);
} else if (cmd === "ide") {
  // Serve IDE and repository static files.
  // Usage: khem ide [dir] [port]
  // If dir omitted, serve package root (one level up from this bin file)
  const dir = args[0] ? path.resolve(args[0]) : path.resolve(__dirname, "..");
  const portArg = Number(args[1] ?? 4173);
  serveStaticDir(dir, Number.isFinite(portArg) ? portArg : 4173);
} else if (cmd === "run") {
  // Quick run a file
  const target = args[0];
  if (!target) {
    console.error("Usage: khem run <file.kh>");
    process.exit(1);
  }
  try {
    const code = fs.readFileSync(target, "utf8");
    const output = run(code);
    if (output.trim()) console.log(output);
  } catch (error) {
    printError(error, target);
    process.exit(1);
  }
} else {
  console.log(`Usage:
  khem run <file.kh>        Run a Khem script
  khem build <file.kh>      Build to HTML (auto-detect web mode)
  khem build <file.kh> --web  Force web mode
  khem watch <file.kh>      Watch and rebuild
  khem serve <file.kh> [port] Serve with live reload
  khem ide [dir] [port]     Serve the IDE (open /ide.html)
  khem repl                 Interactive REPL
  khem test                 Run tests`);
}
