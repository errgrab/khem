#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import readline from "node:readline";
import { spawn } from "node:child_process";
import { run, createEnvironment } from "../src/index.js";
import { ParseError } from "../src/core/parser.js";

const [, , cmd, ...args] = process.argv;

const printError = (error, file = "<stdin>") => {
  if (error instanceof ParseError) {
    console.error(`${file}:${error.line}:${error.column} ${error.message}`);
    return;
  }
  console.error(error?.stack || String(error));
};

const collectModuleSources = (entryPath, visited = new Set(), moduleSources = new Map()) => {
  const absPath = path.resolve(entryPath);
  if (visited.has(absPath)) return moduleSources;
  visited.add(absPath);
  const code = fs.readFileSync(absPath, "utf8");
  moduleSources.set(absPath, code);

  const importPattern = /^\s*import\s+"([^"]+)"\s*$/gm;
  let match = importPattern.exec(code);
  while (match) {
    const childPath = path.resolve(path.dirname(absPath), match[1]);
    collectModuleSources(childPath, visited, moduleSources);
    match = importPattern.exec(code);
  }

  return moduleSources;
};

const compileFile = (filePath) => {
  const absPath = path.resolve(filePath);
  const moduleSources = collectModuleSources(absPath);
  const env = createEnvironment();
  env.entryModule = absPath;
  env.resolveModule = (spec, fromModule) =>
    path.resolve(path.dirname(fromModule || absPath), spec);
  env.readModule = (moduleId) => moduleSources.get(path.resolve(moduleId));
  return run(moduleSources.get(absPath), env);
};

const runTestSuite = () => {
  const nodeSuite = spawn(process.execPath, ["tests/node_test.js"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  nodeSuite.on("exit", (code) => {
    if (code !== 0) {
      process.exit(code ?? 1);
      return;
    }

    const parserSuite = spawn(process.execPath, ["tests/parser_test.js"], {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    parserSuite.on("exit", (parserCode) => {
      process.exit(parserCode ?? 1);
    });
  });
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

const watchFile = (filePath) => {
  const absPath = path.resolve(filePath);
  const outPath = absPath.replace(/\.kh$/i, ".html");

  const build = () => {
    try {
      const html = compileFile(absPath);
      fs.writeFileSync(outPath, html, "utf8");
      console.log(`[khem] rebuilt ${path.basename(outPath)} at ${new Date().toISOString()}`);
    } catch (error) {
      printError(error, absPath);
    }
  };

  build();

  let timer = null;
  fs.watch(absPath, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 40);
  });

  console.log(`[khem] watching ${absPath}`);
};

const serveFile = (filePath, port = 4173) => {
  const absPath = path.resolve(filePath);
  const clients = new Set();
  const sendReload = () => {
    for (const res of clients) {
      res.write(`data: reload\\n\\n`);
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
      res.write("\\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }

    try {
      let html = compileFile(absPath);
      const reloadScript =
        "<script>const es=new EventSource('/__khem_events');es.onmessage=(e)=>{if(e.data==='reload')location.reload();};</script>";
      html = html.includes("</body>")
        ? html.replace("</body>", `${reloadScript}</body>`)
        : `${html}${reloadScript}`;
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(String(error?.stack || error));
    }
  });

  server.listen(port, () => {
    console.log(`[khem] serving ${absPath} at http://localhost:${port}`);
  });
};

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
  watchFile(target);
} else if (cmd === "build") {
  const target = args[0];
  if (!target) {
    console.error("Usage: khem build <file.kh>");
    process.exit(1);
  }

  try {
    const html = compileFile(target);
    process.stdout.write(html);
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
  serveFile(target, Number.isFinite(portArg) ? portArg : 4173);
} else {
  console.log(`Usage:
  khem build <file.kh>
  khem watch <file.kh>
  khem serve <file.kh> [port]
  khem repl
  khem test`);
}
