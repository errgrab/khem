class Khem {
  static Reactivity = class {
    constructor() {
      this.currentEffect = null;
    }

    createSignal(initialValue) {
      let value = initialValue;
      const subscribers = new Set();

      const read = () => {
        if (this.currentEffect) subscribers.add(this.currentEffect);
        return value;
      };

      const write = (newValue) => {
        value = newValue;
        subscribers.forEach((fn) => fn());
      };

      return { read, write, isSignal: true };
    }

    createEffect(fn) {
      this.currentEffect = fn;
      fn();
      this.currentEffect = null;
    }
  };

  static Parser = class {
    static lex(code) {
      const cmds = [];
      let i = 0;
      const len = code.length;

      const peek = () => code[i];
      const eat = () => code[i++];
      const space = (c) => c === " " || c === "\t" || c === "\r";
      const sep = (c) => c === ";" || c === "\n";
      const end = () => i >= len;

      const skipSpaces = () => {
        while (!end() && space(peek())) eat();
      };

      const readBraced = () => {
        eat(); // skip {
        let depth = 1, start = i;
        while (!end()) {
          const c = eat();
          if (c === "{") depth++;
          else if (c === "}") { if (--depth === 0) break; }
        }
        return code.slice(start, i - 1).trim();
      };

      const readBracket = () => {
        eat(); // skip [
        let depth = 1, start = i;
        while (!end()) {
          const c = eat();
          if (c === "[") depth++;
          else if (c === "]") { if (--depth === 0) break; }
        }
        return Khem.Parser.lex(code.slice(start, i - 1).trim());
      };

      const readQuoted = () => {
        eat(); // skip opening "
        let s = "";
        let escaped = false;
        while (!end()) {
          if (!escaped && peek() === '"') break;
          const c = eat();
          if (c === "\\" && !escaped) { escaped = true; continue; }
          if (escaped) {
            escaped = false;
            if (c === "n") { s += "\n"; continue; }
            if (c === "t") { s += "\t"; continue; }
            if (c === "$") { s += "\x01"; continue; }
          }
          s += c;
        }
        if (!end()) eat(); // skip closing "
        return s;
      };

      const readWord = () => {
        let s = "";
        while (!end()) {
          const c = peek();
          if (space(c) || sep(c) || c === "#" || c === "[" || c === "]" || c === "{" || c === "}" || c === '"') break;
          s += eat();
        }
        return s;
      };

      const readCmd = () => {
        const cmd = [];
        while (!end()) {
          skipSpaces();
          if (end()) break;
          const c = peek();
          if (sep(c) || c === "#") break;
          if (c === "{") cmd.push(readBraced());
          else if (c === "[") cmd.push(readBracket());
          else if (c === '"') cmd.push(readQuoted());
          else cmd.push(readWord());
        }
        return cmd;
      };

      while (!end()) {
        skipSpaces();
        if (end()) break;
        const c = peek();
        if (sep(c)) { eat(); continue; }
        if (c === "#") { while (!end() && peek() !== "\n") eat(); continue; }
        const cmd = readCmd();
        if (cmd.length > 0) cmds.push(cmd);
      }

      return cmds;
    }
  };

  static Scope = class {
    constructor(parent, reactivityEngine) {
      this.vars = new Map();
      this.commands = new Map();
      this.parent = parent || null;
      this.reactivity = reactivityEngine;
    }

    set(name, value) {
      if (this.vars.has(name) && this.vars.get(name).isSignal) {
        this.vars.get(name).write(value);
      } else {
        this.vars.set(name, this.reactivity.createSignal(value));
      }
    }

    get(name) {
      if (this.vars.has(name)) return this.vars.get(name).read();
      if (this.parent) return this.parent.get(name);
      throw new Error(`[Khem] Variable '${name}' not defined.`);
    }

    has(name) {
      return this.vars.has(name);
    }

    delete(name) {
      this.vars.delete(name);
    }

    lookup(name) {
      let s = this;
      while (s) {
        if (s.vars.has(name)) return String(s.vars.get(name).read());
        s = s.parent;
      }
      return null;
    }

    resolve(name) {
      if (this.commands.has(name)) return this.commands.get(name);
      if (this.parent) return this.parent.resolve(name);
      return undefined;
    }

    register(name, fn) {
      this.commands.set(name, fn);
    }
  };

  static VM = class {
    constructor(scope) {
      this.scope = scope;
    }

    sub(text) {
      if (typeof text !== "string") return text;
      return text
        .replace(/\$([a-zA-Z_][a-zA-Z0-9_-]*)/g, (match, name) => this.scope.lookup(name) ?? match)
        .replace(/\x01/g, "$");
    }

    evaluate(code, scope) {
      const ast = typeof code === "string" ? Khem.Parser.lex(code) : code;
      const prevScope = this.scope;
      if (scope) this.scope = scope;

      const outputs = [];
      try {
        for (const cmd of ast) {
          if (!Array.isArray(cmd) || cmd.length === 0) continue;

          const cmdName = typeof cmd[0] === "string" ? cmd[0] : null;
          if (!cmdName) continue;

          const command = this.scope.resolve(cmdName);
          if (!command) {
            console.error(`Unknown command: ${cmdName}`);
            continue;
          }

          const rawArgs = cmd.slice(1);
          const args = rawArgs.map((arg) =>
            Array.isArray(arg) ? this.evaluate(arg).join("") : this.sub(arg),
          );

          const result = command(args, this);
          if (result?.__khemReturn) return [result.value ?? ""];
          if (result != null) outputs.push(String(result));
        }
      } finally {
        this.scope = prevScope;
      }

      return outputs;
    }
  };

  static StdLib = class {
    static register(vm) {
      const c = vm.scope.commands;
      const khem = vm._khem;

      const truthy = (v) => v && v !== "0" && v !== "false";
      const num = (v) => Number(v) || 0;

      c.set("text", (args) => args[0] ?? "");

      c.set("set", (args) => {
        vm.scope.set(args[0], args[1] ?? "");
        return null;
      });

      c.set("puts", (args) => {
        console.log(args.join(" "));
        return null;
      });

      c.set("if", (args) => {
        const [condition, trueBlock, elseKeyword, falseBlock] = args;
        if (truthy(condition)) return vm.evaluate(trueBlock);
        if (elseKeyword === "else" && falseBlock) return vm.evaluate(falseBlock);
        return null;
      });

      c.set("for", (args) => {
        const [varName, start, end, body] = args;
        const outputs = [];
        const bodyCmds = Khem.Parser.lex(body);
        const hadOld = vm.scope.has(varName);
        const oldSignal = hadOld ? vm.scope.vars.get(varName) : undefined;
        for (let i = num(start); i <= num(end); i++) {
          vm.scope.set(varName, String(i));
          outputs.push(...vm.evaluate(bodyCmds));
        }
        if (hadOld) vm.scope.vars.set(varName, oldSignal);
        else vm.scope.delete(varName);
        return outputs;
      });

      c.set("foreach", (args) => {
        const [varName, listStr, body] = args;
        const items = String(listStr).split(/\s+/).filter(Boolean);
        const bodyCmds = Khem.Parser.lex(body);
        const outputs = [];
        const hadOld = vm.scope.has(varName);
        const oldSignal = hadOld ? vm.scope.vars.get(varName) : undefined;
        for (const item of items) {
          vm.scope.set(varName, item);
          outputs.push(...vm.evaluate(bodyCmds));
        }
        if (hadOld) vm.scope.vars.set(varName, oldSignal);
        else vm.scope.delete(varName);
        return outputs;
      });

      c.set("proc", (args) => {
        const [name, rawParams, bodyStr] = args;
        const body = Khem.Parser.lex(bodyStr);
        const params = Khem.Parser.lex(rawParams).map((p) =>
          typeof p === "string"
            ? { name: p, default: null }
            : { name: p[0], default: p[1] ?? null },
        );
        vm.scope.commands.set(name, (callArgs, callVm) => {
          const callScope = callVm.scope;
          const local = new Khem.Scope(callScope, callScope.reactivity);
          let argIndex = 0;
          for (const p of params) {
            const value =
              argIndex < callArgs.length
                ? callArgs[argIndex++]
                : (p.default ?? "");
            local.set(p.name, value);
          }
          const result = callVm.evaluate(body, local);
          if (result.length > 0 && result[0]?.__khemReturn) {
            return [result[0].value ?? ""];
          }
          return result;
        });
        return null;
      });

      c.set("return", (args) => ({ __khemReturn: true, value: args[0] ?? "" }));

      c.set("list", (args) => args.join(" "));
      c.set("llength", (args) => args[0].split(/\s+/).filter(Boolean).length);
      c.set("lindex", (args) =>
        args[0].split(/\s+/).filter(Boolean)[num(args[1])] ?? "",
      );
      c.set("lappend", (args) => {
        const cur = vm.scope.has(args[0]) ? (vm.scope.get(args[0]) || "") : "";
        vm.scope.set(args[0], cur + " " + args.slice(1).join(" "));
        return null;
      });
      c.set("concat", (args) => args.join(" "));
      c.set("join", (args) => {
        if (args.length === 2 && args[0].includes(" ")) {
          return args[0].split(/\s+/).join(args[1] || " ");
        }
        return args.join("");
      });

      c.set("expr", (args) => {
        let expr = args.join(" ");
        expr = expr.replace(/==/g, "===").replace(/!=/g, "!==");
        try {
          return String(new Function("return " + expr)());
        } catch {
          return "0";
        }
      });

      c.set("incr", (args) => {
        const cur = vm.scope.has(args[0]) ? (vm.scope.get(args[0]) || "0") : "0";
        const val = String(num(cur) + num(args[1] || 1));
        vm.scope.set(args[0], val);
        return val;
      });

      c.set("abs", (args) => String(Math.abs(num(args[0]))));
      c.set("round", (args) => String(Math.round(num(args[0]))));
      c.set("floor", (args) => String(Math.floor(num(args[0]))));
      c.set("ceil", (args) => String(Math.ceil(num(args[0]))));
      c.set("sqrt", (args) => String(Math.sqrt(num(args[0]))));
      c.set("max", (args) => String(Math.max(...args.map(num))));
      c.set("min", (args) => String(Math.min(...args.map(num))));

      c.set("string", (args) => {
        const [op, str, ...rest] = args;
        switch (op) {
          case "length": return String(str.length);
          case "index": return str[num(rest[0])] || "";
          case "range": return str.slice(num(rest[0]), rest[1] ? num(rest[1]) + 1 : undefined);
          case "trim": return str.trim();
          case "toupper": return str.toUpperCase();
          case "tolower": return str.toLowerCase();
          case "match": {
            const re = new RegExp(rest[0].replace(/\*/g, ".*").replace(/\?/g, "."));
            return re.test(str) ? "1" : "0";
          }
          default: return "";
        }
      });

      c.set("eq", (args) => (args[0] === args[1] ? "1" : "0"));
      c.set("neq", (args) => (args[0] !== args[1] ? "1" : "0"));
      c.set("gt", (args) => (num(args[0]) > num(args[1]) ? "1" : "0"));
      c.set("lt", (args) => (num(args[0]) < num(args[1]) ? "1" : "0"));
      c.set("gte", (args) => (num(args[0]) >= num(args[1]) ? "1" : "0"));
      c.set("lte", (args) => (num(args[0]) <= num(args[1]) ? "1" : "0"));
      c.set("not", (args) => (truthy(args[0]) ? "0" : "1"));
      c.set("and", (args) => (truthy(args[0]) && truthy(args[1]) ? "1" : "0"));
      c.set("or", (args) => (truthy(args[0]) || truthy(args[1]) ? "1" : "0"));

      c.set("replace", (args) => args[0].replaceAll(args[1], args[2]));
      c.set("trim", (args) => args[0].trim());
      c.set("upper", (args) => args[0].toUpperCase());
      c.set("lower", (args) => args[0].toLowerCase());
      c.set("slice", (args) =>
        args[0].slice(num(args[1]), args[2] ? num(args[2]) : undefined));
      c.set("contains", (args) => (args[0].includes(args[1]) ? "1" : "0"));
      c.set("starts-with", (args) => (args[0].startsWith(args[1]) ? "1" : "0"));
      c.set("ends-with", (args) => (args[0].endsWith(args[1]) ? "1" : "0"));

      c.set("today", () => new Date().toISOString().slice(0, 10));
      c.set("clock", (args) => {
        if (args[0] === "seconds") return String(Math.floor(Date.now() / 1000));
        return new Date().toLocaleString();
      });

      c.set("match", (args) => {
        const target = args[0];
        let clauses = [];

        if (args.length === 2 && typeof args[1] === "string") {
          const clauseStr = args[1];
          const parts = [];
          let i = 0;
          while (i < clauseStr.length) {
            while (i < clauseStr.length && /\s/.test(clauseStr[i])) i++;
            if (i >= clauseStr.length) break;

            let pattern = "";
            if (clauseStr[i] === '"') {
              i++;
              while (i < clauseStr.length && clauseStr[i] !== '"') {
                pattern += clauseStr[i]; i++;
              }
              if (i < clauseStr.length) i++;
            } else {
              while (i < clauseStr.length && !/[\s{}]/.test(clauseStr[i])) {
                pattern += clauseStr[i]; i++;
              }
            }

            while (i < clauseStr.length && /\s/.test(clauseStr[i])) i++;

            if (clauseStr[i] === "{") {
              i++;
              let depth = 1, body = "";
              while (i < clauseStr.length && depth > 0) {
                if (clauseStr[i] === "{") depth++;
                if (clauseStr[i] === "}") { depth--; if (depth === 0) break; }
                body += clauseStr[i]; i++;
              }
              if (i < clauseStr.length) i++;
              parts.push([pattern.trim(), body.trim()]);
            }
          }
          clauses = parts;
        } else {
          for (let i = 1; i < args.length; i++) {
            if (Array.isArray(args[i]) && args[i].length >= 2) {
              clauses.push(args[i]);
            }
          }
        }

        let fallback = null;
        for (const [pattern, bodyStr] of clauses) {
          const body = Khem.Parser.lex(bodyStr);
          if (pattern === "default") { fallback = body; continue; }
          if (pattern === target) return vm.evaluate(body);
        }
        return fallback ? vm.evaluate(fallback) : null;
      });

      c.set("try", (args) => {
        try {
          return vm.evaluate(Khem.Parser.lex(args[0]));
        } catch (e) {
          const hadError = vm.scope.has("error");
          const oldError = hadError ? vm.scope.vars.get("error") : undefined;
          if (args[1] === "catch" && args[2]) {
            vm.scope.set("error", e.message);
            const result = vm.evaluate(Khem.Parser.lex(args[2]));
            if (hadError) vm.scope.vars.set("error", oldError);
            else vm.scope.delete("error");
            return result;
          }
          if (hadError) vm.scope.vars.set("error", oldError);
          else vm.scope.delete("error");
          throw e;
        }
      });

      c.set("throw", (args) => { throw new Error(args[0]); });

      c.set("dict", (args) => {
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
            const key = rest[1], val = rest[2];
            let found = false;
            for (let i = 0; i < items.length; i += 2) {
              if (items[i] === key) { items[i + 1] = val; found = true; break; }
            }
            if (!found) items.push(key, val);
            return items.join(" ");
          }
          default: return "";
        }
      });

      // --- Include ---
      let _fs = null, _path = null;
      const isNode = () => typeof process !== "undefined" && process.versions?.node != null;

      if (isNode()) {
        Promise.all([
          import("node:fs").catch(() => null),
          import("node:path").catch(() => null),
        ]).then(([fsMod, pathMod]) => {
          if (fsMod) _fs = fsMod.default ?? fsMod;
          if (pathMod) _path = pathMod.default ?? pathMod;
        });
      }

      c.set("include", ([file]) => {
        if (!file) return;
        if (!isNode()) { console.warn(`include "${file}" skipped — browser`); return; }
        if (!_fs || !_path) { console.error(`include "${file}" skipped — no fs`); return; }
        const base = khem._baseDir ?? process.cwd();
        const abs = _path.resolve(base, file);
        if (!khem._includes) khem._includes = new Set();
        if (khem._includes.has(abs)) return;
        khem._includes.add(abs);
        const prev = khem._baseDir;
        try {
          khem._baseDir = _path.dirname(abs);
          const code = _fs.readFileSync(abs, "utf8");
          vm.evaluate(Khem.Parser.lex(code));
        } catch (e) { console.error(`include error: ${e.message}`); }
        finally { khem._baseDir = prev; }
      });
    }
  };

  constructor() {
    this.reactivity = new Khem.Reactivity();
    this.scope = new Khem.Scope(null, this.reactivity);
    this.vm = new Khem.VM(this.scope);
    this.vm._khem = this;

    // env-style properties (backward compat with web.js, include, etc.)
    this._state = {};
    this._webCtx = null;
    this._output = "";
    this._source = "";
    this._baseDir = null;
    this._includes = null;
    this._elemAttrs = null;
    this._elemEvents = null;

    Khem.StdLib.register(this.vm);
  }

  register(commandName, fn) {
    this.scope.register(commandName, fn);
  }

  run(scriptCode) {
    return this.vm.evaluate(scriptCode).join("");
  }

  createEffect(fn) {
    this.reactivity.createEffect(fn);
  }

  get vars() {
    const scope = this.scope;
    return new Proxy(this.scope.vars, {
      get(_, name) {
        if (typeof name === "string" && scope.has(name)) return scope.get(name);
        return undefined;
      },
      set(_, name, value) {
        scope.set(name, value);
        return true;
      },
      has(_, name) {
        return scope.has(name);
      },
    });
  }
}

export default Khem;
