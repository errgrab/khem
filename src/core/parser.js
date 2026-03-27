export function parse(code) {
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
    let depth = 1,
      start = i;
    while (!end()) {
      const c = eat();
      if (c === "{") depth++;
      else if (c === "}") {
        if (--depth === 0) break;
      }
    }
    return code.slice(start, i - 1).trim(); // exclude closing }
  };

  const readBracket = () => {
    eat(); // skip [
    let depth = 1,
      start = i;
    while (!end()) {
      const c = eat();
      if (c === "[") depth++;
      else if (c === "]") {
        if (--depth === 0) break;
      }
    }
    // Recursively parse the inner command
    return parse(code.slice(start, i - 1).trim()); // exclude closing ]
  };

  const readQuoted = () => {
    eat(); // skip "
    let s = "";
    while (!end() && peek() !== '"') {
      const c = eat();
      s += c === "\\" && !end() ? eat() : c;
    }
    if (!end()) eat(); // skip "
    return s;
  };

  const readWord = () => {
    let s = "";
    while (!end()) {
      const c = peek();
      if (
        space(c) ||
        sep(c) ||
        c === "#" ||
        c === "[" ||
        c === "]" ||
        c === "{" ||
        c === "}" ||
        c === '"'
      )
        break;
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
    if (sep(c)) {
      eat();
      continue;
    }
    if (c === "#") {
      while (!end() && peek() !== "\n") eat();
      continue;
    }
    const cmd = readCmd();
    if (cmd.length > 0) cmds.push(cmd);
  }

  return cmds;
}
