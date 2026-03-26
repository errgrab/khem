export class ParseError extends Error {
  constructor(message, line = 1, column = 1) {
    super(message);
    this.name = "ParseError";
    this.line = line;
    this.column = column;
  }
}

export function parse(code) {
  const cmds = [];
  let i = 0;
  const len = code.length;

  while (i < len) {
    // Skip whitespace (but not newlines - they end commands)
    while (i < len && /[ \t\r]/.test(code[i])) i++;
    if (i >= len) break;

    // Skip comments
    if (code[i] === '#') {
      while (i < len && code[i] !== '\n') i++;
      continue;
    }

    // Semicolon or newline separates commands
    if (code[i] === ';' || code[i] === '\n') { i++; continue; }

    const cmd = [];
    
    while (i < len) {
      // Skip whitespace before word (but not newlines)
      while (i < len && /[ \t\r]/.test(code[i])) i++;
      if (i >= len) break;

    // Semicolon or newline ends command
    if (code[i] === ';' || code[i] === '\n') break;

    // Comment inside command
    if (code[i] === '#') {
      while (i < len && code[i] !== '\n') i++;
      break;
    }

    // Command substitution [ ... ]
      if (code[i] === '[') {
        i++; // skip [
        let depth = 1, start = i;
        while (i < len && depth > 0) {
          if (code[i] === '[') depth++;
          if (code[i] === ']') { depth--; if (depth === 0) break; }
          i++;
        }
        const inner = code.slice(start, i).trim();
        if (i < len) i++; // skip ]
        if (inner) cmd.push(parse(inner)); // recursively parse
        continue;
      }

      // Braced literal { ... }
      if (code[i] === '{') {
        i++; // skip {
        let depth = 1, start = i;
        while (i < len && depth > 0) {
          if (code[i] === '{') depth++;
          if (code[i] === '}') { depth--; if (depth === 0) break; }
          i++;
        }
        const value = code.slice(start, i).trim();
        if (i < len) i++; // skip }
        cmd.push(value);
        continue;
      }

      // Quoted string " ... "
      if (code[i] === '"') {
        i++; // skip "
        let value = '';
        while (i < len && code[i] !== '"') {
          if (code[i] === '\\' && i + 1 < len) {
            i++;
            value += code[i];
          } else {
            value += code[i];
          }
          i++;
        }
        if (i < len) i++; // skip "
        cmd.push(value);
        continue;
      }

      // Regular word
      let word = '';
      while (i < len && !/[\s;#\[\]{}"]/.test(code[i])) {
        word += code[i];
        i++;
      }
      if (word) cmd.push(word);
    }

    if (cmd.length > 0) cmds.push(cmd);
  }

  return cmds;
}
