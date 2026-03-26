import { parse, ParseError } from "../src/core/parser.js";

function assertEqual(actual, expected, msg) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${msg}: expected ${expectedStr}, got ${actualStr}`);
  }
}

function assertThrows(fn, msg) {
  try {
    fn();
    throw new Error(`${msg}: expected to throw`);
  } catch (e) {
    if (e.name === "ParseError") return;
    throw e;
  }
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}

// Parser Tests
console.log("\n=== Parser Tests ===\n");

test("parse: empty string", () => {
  const result = parse("");
  assertEqual(result, []);
});

test("parse: simple command", () => {
  const result = parse("puts hello");
  assertEqual(result, [["puts", "hello"]]);
});

test("parse: command with multiple args", () => {
  const result = parse("set x 42");
  assertEqual(result, [["set", "x", "42"]]);
});

test("parse: semicolon separator", () => {
  const result = parse("puts a; puts b");
  assertEqual(result, [["puts", "a"], ["puts", "b"]]);
});

test("parse: newline separator", () => {
  const result = parse("puts a\nputs b");
  assertEqual(result, [["puts", "a"], ["puts", "b"]]);
});

test("parse: comment ignored", () => {
  const result = parse("puts hello # this is a comment");
  assertEqual(result, [["puts", "hello"]]);
});

test("parse: double quoted string", () => {
  const result = parse('puts "Hello World"');
  assertEqual(result, [["puts", "Hello World"]]);
});

test("parse: double quoted string with spaces", () => {
  const result = parse('set msg "Hello World"');
  assertEqual(result, [["set", "msg", "Hello World"]]);
});

test("parse: braced literal (block)", () => {
  const result = parse("if $x { puts true }");
  assertEqual(result, [["if", "$x", "puts true"]]);
});

test("parse: command substitution", () => {
  const result = parse("set x [expr 2 + 3]");
  assertEqual(result, [["set", "x", [["expr", "2", "+", "3"]]]]);
});

test("parse: nested command substitution", () => {
  const result = parse("puts [concat [expr 1] [expr 2]]");
  assertEqual(result, [["puts", [["concat", [["expr", "1"]], [["expr", "2"]]]]]]);
});

test("parse: variable substitution in string", () => {
  const result = parse('puts "Hello $name"');
  assertEqual(result, [["puts", "Hello $name"]]);
});

test("parse: braces preserve literal (no substitution)", () => {
  const result = parse('set code { puts "$name" }');
  assertEqual(result, [["set", "code", 'puts "$name"']]);
});

test("parse: multiple commands", () => {
  const result = parse("set x 1\nset y 2\nset z 3");
  assertEqual(result, [["set", "x", "1"], ["set", "y", "2"], ["set", "z", "3"]]);
});

test("parse: word with underscore", () => {
  const result = parse("set my_var 42");
  assertEqual(result, [["set", "my_var", "42"]]);
});

test("parse: word with numbers", () => {
  const result = parse("set var1 42");
  assertEqual(result, [["set", "var1", "42"]]);
});

test("parse: empty command", () => {
  const result = parse("puts");
  assertEqual(result, [["puts"]]);
});

test("parse: multiple semicolons", () => {
  const result = parse("puts a;;;puts b");
  assertEqual(result, [["puts", "a"], ["puts", "b"]]);
});

test("parse: quoted string with escaped quote", () => {
  const result = parse('puts "say \\"hello\\""');
  assertEqual(result, [["puts", 'say "hello"']]);
});

test("parse: proc definition", () => {
  const result = parse("proc greet { who } { puts Hello }");
  assertEqual(result, [["proc", "greet", "who", "puts Hello"]]);
});

test("parse: if/else", () => {
  const result = parse("if $x > 0 { puts positive } else { puts negative }");
  assertEqual(result, [["if", "$x", ">", "0", "puts positive", "else", "puts negative"]]);
});

test("parse: for loop", () => {
  const result = parse("for i 1 10 { puts $i }");
  assertEqual(result, [["for", "i", "1", "10", "puts $i"]]);
});

test("parse: foreach loop", () => {
  const result = parse("foreach item $items { puts $item }");
  assertEqual(result, [["foreach", "item", "$items", "puts $item"]]);
});

test("parse: match command", () => {
  const result = parse('match $x { "hello" { puts greeting } "bye" { puts farewell } default { puts other } }');
  assertEqual(result, [["match", "$x", '"hello" { puts greeting } "bye" { puts farewell } default { puts other }']]);
});

test("parse: list command", () => {
  const result = parse("list a b c");
  assertEqual(result, [["list", "a", "b", "c"]]);
});

test("parse: dict create", () => {
  const result = parse('dict create name "John" age "30"');
  assertEqual(result, [["dict", "create", "name", "John", "age", "30"]]);
});

test("parse: string command", () => {
  const result = parse("string toupper hello");
  assertEqual(result, [["string", "toupper", "hello"]]);
});

test("parse: expr with operators", () => {
  const result = parse("expr 2 + 3 * 4");
  assertEqual(result, [["expr", "2", "+", "3", "*", "4"]]);
});

test("parse: nested braces", () => {
  const result = parse("proc test { a } { if $a { puts yes } else { puts no } }");
  assertEqual(result, [["proc", "test", "a", "if $a { puts yes } else { puts no }"]]);
});

test("parse: empty block", () => {
  const result = parse("if $x {}");
  assertEqual(result, [["if", "$x", ""]]);
});

test("parse: whitespace handling", () => {
  const result = parse("  puts   hello  ");
  assertEqual(result, [["puts", "hello"]]);
});

console.log(`\n=== Parser Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) process.exit(1);