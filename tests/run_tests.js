import { parse } from "../src/core/parser.js";
import { evaluate, createEnvironment } from "../src/index.js";

const results = {
  passed: 0,
  failed: 0,
  suites: {}
};

function runTestFile(filePath) {
  const suiteName = filePath.replace('tests/', '').replace('_test.js', '');
  results.suites[suiteName] = [];
  
  const code = `
    import { parse } from "../src/core/parser.js";
    import { createEnvironment, runForWeb } from "../src/index.js";
    
    let passed = 0;
    let failed = 0;
    let tests = [];
    
    function test(name, fn) {
      try {
        fn();
        passed++;
        tests.push({ name, pass: true });
      } catch (e) {
        failed++;
        tests.push({ name, pass: false, msg: e.message });
      }
    }
    
    function assertContains(str, substring, msg) {
      if (!str.includes(substring)) throw new Error(msg + ': missing "' + substring + '"');
    }
    
    function assertNotContains(str, substring, msg) {
      if (str.includes(substring)) throw new Error(msg + ': should NOT contain "' + substring + '"');
    }
    
    // Run all tests...
    test("sample test", () => {
      const html = runForWeb('page "home" { text "Home" }');
      assertContains(html, 'Home', "page content");
    });
  `;
  
  return results.suites[suiteName];
}

import { runForWeb } from "../src/index.js";

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

function assertContains(str, substring, msg) {
  if (!str.includes(substring)) throw new Error(`${msg}: expected to contain "${substring}"`);
}

console.log("\n=== Running Tests ===\n");

// Parser Tests
console.log("--- Parser ---\n");
const parserSuite = [];
results.suites.parser = parserSuite;

test("parse: empty string", () => {
  const result = parse("");
  if (JSON.stringify(result) !== "[]") throw new Error("expected empty array");
}, parserSuite);

test("parse: simple command", () => {
  const result = parse("puts hello");
  if (JSON.stringify(result) !== '[["puts","hello"]]') throw new Error("unexpected result");
}, parserSuite);

test("parse: command with multiple args", () => {
  const result = parse("set x 42");
  if (JSON.stringify(result) !== '[["set","x","42"]]') throw new Error("unexpected result");
}, parserSuite);

// StdLib Tests
console.log("\n--- StdLib ---\n");
const stdlibSuite = [];
results.suites.stdlib = stdlibSuite;

test("stdlib: puts outputs", () => {
  const env = createEnvironment();
  const output = evaluate(parse('puts "hello"'), { vars: {}, parent: null }, env);
  if (!output.join("").includes("hello")) throw new Error("puts did not output");
}, stdlibSuite);

test("stdlib: set/get", () => {
  const env = createEnvironment();
  evaluate(parse('set x 10'), { vars: {}, parent: null }, env);
  const output = evaluate(parse('get x'), { vars: {}, parent: null }, env);
  if (!output.join("").includes("10")) throw new Error("get did not return set value");
}, stdlibSuite);

// Web Tests
console.log("\n--- Web ---\n");
const webSuite = [];
results.suites.web = webSuite;

test("web: page renders", () => {
  const html = runForWeb('page "home" { text "Home" }\nroute "#/" "home"');
  assertContains(html, "Home", "page content");
}, webSuite);

test("web: title set", () => {
  const html = runForWeb('title "My App"\npage "home" { text "Home" }\nroute "#/" "home"');
  assertContains(html, "<title>My App</title>", "title");
}, webSuite);

test("web: state variable", () => {
  const html = runForWeb('state count 5\npage "home" { text $count }\nroute "#/" "home"');
  assertContains(html, '"count":"5"', "state value");
}, webSuite);

test("web: button renders", () => {
  const html = runForWeb('page "home" { button "" { text "Click" } }\nroute "#/" "home"');
  assertContains(html, "<button", "button tag");
}, webSuite);

test("web: input renders", () => {
  const html = runForWeb('page "home" { input "" "" "placeholder=test" }\nroute "#/" "home"');
  assertContains(html, "placeholder=test", "input placeholder");
}, webSuite);

test("web: default CSS includes design system", () => {
  const html = runForWeb('page "home" { text "Home" }\nroute "#/" "home"');
  assertContains(html, "--bg:", "CSS variables");
  assertContains(html, "--mono:", "font variable");
}, webSuite);

// Summary
console.log(`\n=== Results: ${results.passed} passed, ${results.failed} failed ===\n`);

// Write JSON results
import { writeFileSync } from "node:fs";
writeFileSync("tests/results.json", JSON.stringify(results, null, 2));
console.log("Results written to tests/results.json");
console.log("Open tests/runner.html to view styled results");