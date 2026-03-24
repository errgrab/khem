export function parse(code) {
  const tokens = [...code.matchAll(/"([^"]*)"|(#.*)|([{}])|([;\n])|([^\s{}";\n]+)/g)]
    .map(m => m[1] !== undefined ? m[1] : (m[3] || m[4] || m[5]))
    .filter(Boolean);

  let cursor = 0;
  function walk() {
    let block = [], stmt = [];
    while (cursor < tokens.length) {
      let t = tokens[cursor++];
      if (t === ';' || t === '\n') { if (stmt.length) { block.push(stmt); stmt = []; } }
      else if (t === '}') { if (stmt.length) block.push(stmt); return block; }
      else if (t === '{') { stmt.push(walk()); }
      else { stmt.push(t); }
    }
    if (stmt.length) block.push(stmt);
    return block;
  }
  return walk();
}
