import { run, createEnvironment, parse, evaluate, runForWeb } from "../src/index.js";

const results = {
  passed: 0,
  failed: 0,
  suites: {}
};

function test(name, fn, suite) {
  try {
    fn();
    results.passed++;
    suite.push({ name, pass: true });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.failed++;
    suite.push({ name, pass: false, msg: e.message });
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg}: expected "${expected}", got "${actual}"`);
}

console.log("\n=== Running Tests ===\n");

// Parser Tests
console.log("--- Parser ---\n");
const parserSuite = [];
results.suites.parser = parserSuite;

test("parse: empty string", () => {
  const result = parse("");
  assertEqual(JSON.stringify(result), "[]", "empty");
}, parserSuite);

test("parse: simple command", () => {
  const result = parse("puts hello");
  assertEqual(JSON.stringify(result), '[["puts","hello"]]', "simple cmd");
}, parserSuite);

test("parse: command with multiple args", () => {
  const result = parse("set x 42");
  assertEqual(JSON.stringify(result), '[["set","x","42"]]', "multiple args");
}, parserSuite);

// StdLib Tests
console.log("\n--- StdLib ---\n");
const stdlibSuite = [];
results.suites.stdlib = stdlibSuite;

test("set: simple variable", () => {
  const env = createEnvironment();
  run("set x 42", env);
  assertEqual(env.vars.x, "42", "set variable");
}, stdlibSuite);

test("set: string variable", () => {
  const env = createEnvironment();
  run('set name "Khem"', env);
  assertEqual(env.vars.name, "Khem", "set string");
}, stdlibSuite);

test("if: true condition", () => {
  const env = createEnvironment();
  run("set x 1\nif $x { set result yes }", env);
  assertEqual(env.vars.result, "yes", "if true");
}, stdlibSuite);

test("if: false condition", () => {
  const env = createEnvironment();
  run("set x 0\nif $x { set result yes } else { set result no }", env);
  assertEqual(env.vars.result, "no", "if false");
}, stdlibSuite);

test("for: basic loop", () => {
  const env = createEnvironment();
  run("for i 1 3 { puts $i }", env);
  // loop executed without error = pass
}, stdlibSuite);

// Web Tests
console.log("\n--- Web ---\n");
const webSuite = [];
results.suites.web = webSuite;

test("web: page renders", () => {
  const html = runForWeb('page "home" { text "Home" }\nroute "#/" "home"');
  if (!html.includes("Home")) throw new Error("page content missing");
}, webSuite);

test("web: title set", () => {
  const html = runForWeb('title "My App"\npage "home" { text "Home" }\nroute "#/" "home"');
  if (!html.includes("<title>My App</title>")) throw new Error("title missing");
}, webSuite);

test("web: state variable", () => {
  const html = runForWeb('state count 5\npage "home" { text $count }\nroute "#/" "home"');
  if (!html.includes('"count":"5"')) throw new Error("state value missing");
}, webSuite);

test("web: button renders", () => {
  const html = runForWeb('page "home" { button "" { text "Click" } }\nroute "#/" "home"');
  if (!html.includes("<button")) throw new Error("button tag missing");
}, webSuite);

test("web: input renders", () => {
  const html = runForWeb('page "home" { input "" "" "placeholder=test" }\nroute "#/" "home"');
  if (!html.includes("placeholder=test")) throw new Error("input placeholder missing");
}, webSuite);

test("web: default CSS includes design system", () => {
  const html = runForWeb('page "home" { text "Home" }\nroute "#/" "home"');
  if (!html.includes("--bg:")) throw new Error("CSS variables missing");
  if (!html.includes("--mono:")) throw new Error("font variable missing");
}, webSuite);

// Summary
console.log(`\n=== Results: ${results.passed} passed, ${results.failed} failed ===\n`);

// Write JSON results
import { writeFileSync } from "node:fs";
writeFileSync("tests/results.json", JSON.stringify(results, null, 2));
console.log("Results written to tests/results.json");
console.log("Open tests/runner.html to view styled results");