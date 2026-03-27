#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import readline from "node:readline";
import { spawn } from "node:child_process";
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
    /^\s*(document|page|route|state|title)\s/m.test(code) ||
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
  khem repl                 Interactive REPL
  khem test                 Run tests`);
}
