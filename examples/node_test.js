import { run, createEnvironment } from "../src/index.js";

const env = createEnvironment();

const tests = [
  {
    name: "Variables & Substitution",
    code: `
      set title "Khem Node Test"
      set version "1.0"
      text "$title v$version"
    `,
    expect: "Khem Node Test v1.0",
  },
  {
    name: "Standard Lib: If/Else (True)",
    code: `
      set x "1"
      if "1 === 1" { text "TRUE" } else { text "FALSE" }
    `,
    expect: "TRUE",
  },
  {
    name: "Standard Lib: If/Else (False)",
    code: `
      set x "1"
      if "1 === 2" { text "TRUE" } else { text "FALSE" }
    `,
    expect: "FALSE",
  },
  {
    name: "Standard Lib: For Loop",
    code: `
      for i 1 3 { text "$i " }
    `,
    expect: "1 2 3",
  },
  {
    name: "Standard Lib: Foreach Loop",
    code: `
      foreach item "a b c" { text "($item)" }
    `,
    expect: "(a)(b)(c)",
  },
  {
    name: "Procedures (Components)",
    code: `
      proc card { {title "Default"} {body "None"} } {
        div "card" {
          h1 "" { text $title }
          p "" { text $body }
        }
      }
      card "Hello" "World"
    `,
    expect: '<div class="card"><h1>Hello</h1><p>World</p></div>',
  },
  {
    name: "Complex Nesting & Scoping",
    code: `
      set outer "Global"
      proc nested { inner } {
        div "box" {
          text "$outer : $inner"
        }
      }
      nested "Local"
    `,
    expect: '<div class="box">Global : Local</div>',
  },
  {
    name: "Web Lib: Styles & HTML Tags",
    code: `
      div "container" {
        span "text-bold" { text "Hello" }
      }
    `,
    expect: '<div class="container"><span class="text-bold">Hello</span></div>',
  },
  {
    name: "Web Lib: Semantic Helpers",
    code: `
      ui {
        panel { text "Content" }
      }
    `,
    expect:
      '<div style="display: flex; flex-direction: column; gap: 0.75rem;"><div style="border: 1px solid var(--border); background: var(--s1); padding: 1rem;">Content</div></div>',
  },
  {
    name: "Web Lib: Document Boilerplate",
    code: `
      document "My App" {
        div "body" { text "Hello" }
      }
    `,
    expect: (html) =>
      html.includes("<title>My App</title>") &&
      html.includes('<div class="body">Hello</div>'),
  },
  {
    name: "Edge Case: Missing Command",
    code: `
      unknown_command "arg"
    `,
    expect: "",
  },
  {
    name: "Edge Case: Nested Substitutions",
    code: `
      set var1 "v2"
      set v2 "Value"
      text "$$var1"
    `,
    expect: "Value", // Corrected expectation
  },
];

let failed = 0;

console.log("\n🚀 Running Khem Heavy Tests (Node.js)\n" + "=".repeat(40));

tests.forEach((t) => {
  try {
    const result = run(t.code, createEnvironment()).trim();
    let passed = false;

    if (typeof t.expect === "function") {
      passed = t.expect(result);
    } else {
      passed = result === t.expect;
    }

    if (passed) {
      console.log(`✅ [PASS] ${t.name}`);
    } else {
      console.log(`❌ [FAIL] ${t.name}`);
      console.log(
        `   Expected: ${typeof t.expect === "function" ? "[Check Function]" : t.expect}`,
      );
      console.log(`   Got:      ${result}`);
      failed++;
    }
  } catch (err) {
    console.log(`💥 [ERROR] ${t.name}`);
    console.error(err);
    failed++;
  }
});

console.log("\n" + "=".repeat(40));
if (failed === 0) {
  console.log("✨ ALL TESTS PASSED! ✨\n");
} else {
  console.log(`⛔ ${failed} TEST(S) FAILED. ⛔\n`);
  process.exit(1);
}
