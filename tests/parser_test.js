import assert from "node:assert/strict";
import { parse, parseAst, ParseError } from "../src/core/parser.js";

const validCases = [
  {
    name: "simple command",
    code: 'text "hello"',
    expect: [["text", "hello"]],
  },
  {
    name: "nested block",
    code: 'if "1 === 1" { text "yes" } else { text "no" }',
    expect: [["if", "1 === 1", [["text", "yes"]], "else", [["text", "no"]]]],
  },
  {
    name: "comments and separators",
    code: 'set x 1; # comment\ntext "$x"',
    expect: [
      ["set", "x", "1"],
      ["text", "$x"],
    ],
  },
];

const invalidCases = [
  {
    name: "unmatched close brace",
    code: 'text "x" }',
    codeId: "E_UNMATCHED_CLOSE_BRACE",
  },
  {
    name: "unmatched open brace",
    code: 'if "1" { text "x"',
    codeId: "E_UNMATCHED_OPEN_BRACE",
  },
  {
    name: "unterminated string",
    code: 'text "x',
    codeId: "E_UNTERMINATED_STRING",
  },
  {
    name: "invalid top-level token sequence",
    code: '{ text "x" }',
    codeId: "E_INVALID_SEQUENCE",
  },
  {
    name: "invalid statement head",
    code: '"oops" value',
    codeId: "E_INVALID_SEQUENCE",
  },
];

console.log("\n🧪 Running parser tests\n" + "=".repeat(32));

for (const t of validCases) {
  const out = parse(t.code);
  assert.deepEqual(out, t.expect, `valid case failed: ${t.name}`);
  const ast = parseAst(t.code);
  assert.equal(ast.type, "Block", `AST should be Block: ${t.name}`);
  console.log(`✅ [PASS] ${t.name}`);
}

for (const t of invalidCases) {
  let error = null;
  try {
    parse(t.code);
  } catch (e) {
    error = e;
  }

  assert.ok(error, `expected error: ${t.name}`);
  assert.ok(error instanceof ParseError, `error type: ${t.name}`);
  assert.equal(error.code, t.codeId, `error code mismatch: ${t.name}`);
  assert.equal(typeof error.line, "number", `error line missing: ${t.name}`);
  assert.equal(
    typeof error.column,
    "number",
    `error column missing: ${t.name}`,
  );
  console.log(`✅ [PASS] ${t.name}`);
}

console.log("=".repeat(32));
console.log("✨ parser tests passed\n");
