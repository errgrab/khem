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
  {
    name: "Typed literals are preserved",
    code: `
      set i int 42
      set f float 3.5
      set t bool true
      text "$i/$f/$t"
    `,
    expect: "42/3.5/true",
  },
  {
    name: "Expr command arithmetic and boolean",
    code: `
      set a 2
      set b 3
      set sum expr "$a + $b * 2"
      if "$sum == 8" { text "ok" } else { text "bad" }
    `,
    expect: "ok",
  },
  {
    name: "Proc return value",
    code: `
      proc add2 { x } {
        set result expr "$x + 2"
        return $result
      }
      set out add2 5
      text "$out"
    `,
    expect: "7",
  },
  {
    name: "List and map literals",
    code: `
      set xs list a b c
      set flag bool true
      set obj map name "khem" stable $flag
      text $xs
      text "|"
      text $obj
    `,
    expect: 'abc|{"name":"khem","stable":true}',
  },
  {
    name: "Try catch and throw",
    code: `
      try {
        throw "boom"
      } catch {
        text $error
      }
    `,
    expect: "boom",
  },
  {
    name: "Reactive state primitive",
    code: `
      state count 1
      set count expr "$count + 1"
      text "$count"
    `,
    expect: "2",
  },
  {
    name: "Persist command is safe without browser storage",
    code: `
      state name "khem"
      persist name
      set name "khem2"
      text "$name"
    `,
    expect: "khem2",
  },
  {
    name: "Derive recomputes on state updates",
    code: `
      state price 10
      state qty 3
      derive total {
        expr "$price * $qty"
      }
      set qty 4
      text "$total"
    `,
    expect: "40",
  },
  {
    name: "String and list helpers",
    code: `
      set raw " hello "
      set clean trim "$raw"
      set loud upper "$clean"
      set chars split "$loud" "E"
      set count length $chars
      text "$clean|$loud|$count"
    `,
    expect: "hello|HELLO|2",
  },
  {
    name: "Replace/map/filter/reduce helpers",
    code: `
      set words list "a-x" "bb-x" "ccc"
      set replaced replace "a-x" "-x" ""
      set sized map $words length
      set filtered filter $sized gt 3
      set sum reduce $filtered + 0
      text "$replaced|$sum"
    `,
    expect: "a|4",
  },
  {
    name: "Date and math helpers",
    code: `
      set y year-of "2026-03-26"
      set m month-of "2026-03-26"
      set d day-of "2026-03-26"
      set dim days-in-month 2024 2
      set p pow 2 5
      set c clamp 11 0 7
      text "$y/$m/$d/$dim/$p/$c"
    `,
    expect: "2026/3/26/29/32/7",
  },
  {
    name: "Pattern matching",
    code: `
      set status "F"
      match $status {
        "F" { text "Full" }
        "" { text "Empty" }
        default { text "Other" }
      }
    `,
    expect: "Full",
  },
  {
    name: "Component library primitives",
    code: `
      modal { text "M" }
      tabs { text "T" }
      toast { text "Z" }
      table { text "R" }
      form { text "F" }
      datepicker "x"
    `,
    expect:
      '<div class="khem-modal"><div class="khem-modal-card">M</div></div><div class="khem-tabs">T</div><div class="khem-toast">Z</div><table class="khem-table">R</table><form class="khem-form">F</form><input type="date" class="khem-datepicker x">',
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
