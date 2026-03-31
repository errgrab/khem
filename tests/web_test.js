import { parse } from "../src/core/parser.js";
import { evaluate, createScope } from "../src/core/engine.js";
import { loadStdLib } from "../src/plugins/stdlib.js";
import { loadWebLib, generateHTML } from "../src/plugins/web.js";

// Inline web.kh procs
const WEB_KH = `proc div {body} { elem "div" "$body" }
proc span {body} { elem "span" "$body" }
proc p {body} { elem "p" "$body" }
proc h1 {body} { elem "h1" "$body" }
proc h2 {body} { elem "h2" "$body" }
proc h3 {body} { elem "h3" "$body" }
proc ul {body} { elem "ul" "$body" }
proc ol {body} { elem "ol" "$body" }
proc li {body} { elem "li" "$body" }
proc table {body} { elem "table" "$body" }
proc tr {body} { elem "tr" "$body" }
proc td {body} { elem "td" "$body" }
proc section {body} { elem "section" "$body" }
proc main {body} { elem "main" "$body" }
proc header {body} { elem "header" "$body" }
proc footer {body} { elem "footer" "$body" }
proc nav {body} { elem "nav" "$body" }
proc button {body} { elem "button" "$body" }
proc br {} { elem "br" "" }
proc hr {} { elem "hr" "" }
proc class {name} { attr "class" "$name" }
proc id {name} { attr "id" "$name" }
proc data {key; val} { attr "data-$key" "$val" }
proc on_click {body} { on "click" "$body" }
proc on_input {body} { on "input" "$body" }`;

function runForWeb(code) {
  try {
    const env = { cmds: {}, vars: {}, _state: {}, _stateRefs: new Set() };
    loadStdLib(env);
    loadWebLib(env);
    const scope = createScope();
    // Load web.kh procs
    evaluate(parse(WEB_KH), scope, env);
    // Run user code
    env._output = evaluate(parse(code), scope, env).join("");
    return generateHTML(env);
  } catch (e) {
    console.error("Error:", e);
    return "";
  }
}

function assertContains(str, substring, msg) {
  if (!str.includes(substring))
    throw new Error(`${msg}: expected to contain "${substring}"`);
}
function assertNotContains(str, substring, msg) {
  if (str.includes(substring))
    throw new Error(`${msg}: expected NOT to contain "${substring}"`);
}

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log("\n=== Web Library Tests (New Architecture) ===\n");

// HTML Tags
console.log("--- HTML Tags ---\n");

test("div: with class via attr block", () => {
  const html = runForWeb('div { class "container"; text "Hello" }');
  assertContains(html, '<div class="container">Hello</div>', "div with class");
});

test("div: with id", () => {
  const html = runForWeb('div { id "main"; text "Hello" }');
  assertContains(html, '<div id="main">Hello</div>', "div with id");
});

test("div: class and id", () => {
  const html = runForWeb('div { class "app"; id "root"; text "Hello" }');
  assertContains(html, 'class="app"', "has class");
  assertContains(html, 'id="root"', "has id");
});

test("p: paragraph", () => {
  const html = runForWeb('p { class "text"; text "Paragraph" }');
  assertContains(html, '<p class="text">Paragraph</p>', "p");
});

test("span: span", () => {
  const html = runForWeb('span { class "badge"; text "NEW" }');
  assertContains(html, '<span class="badge">NEW</span>', "span");
});

test("h1-h2: headings", () => {
  const html = runForWeb('div { h1 { text "Title" }; h2 { text "Subtitle" } }');
  assertContains(html, "<h1>Title</h1>", "h1");
  assertContains(html, "<h2>Subtitle</h2>", "h2");
});

test("button: basic", () => {
  const html = runForWeb('button { class "btn"; text "Click" }');
  assertContains(html, '<button class="btn">Click</button>', "button");
});

test("a: link with href", () => {
  const html = runForWeb('a "/about" { class "link"; text "About" }');
  assertContains(html, 'href="/about"', "href");
  assertContains(html, 'class="link"', "class");
  assertContains(html, ">About</a>", "content");
});

test("ul/li: list", () => {
  const html = runForWeb('ul { li { text "Item 1" }; li { text "Item 2" } }');
  assertContains(html, "<ul>", "ul");
  assertContains(html, "<li>Item 1</li>", "li 1");
  assertContains(html, "<li>Item 2</li>", "li 2");
});

test("table/tr/td: table", () => {
  const html = runForWeb('table { tr { td { text "Cell" } } }');
  assertContains(html, "<table>", "table");
  assertContains(html, "<tr>", "tr");
  assertContains(html, "<td>Cell</td>", "td");
});

test("br/hr: void elements", () => {
  const html = runForWeb('div { br; hr }');
  assertContains(html, "<br>", "br");
  assertContains(html, "<hr>", "hr");
});

test("section/main/header/footer: semantic", () => {
  const html = runForWeb('section { main { text "M" }; header { text "H" } }');
  assertContains(html, "<section>", "section");
  assertContains(html, "<main>", "main");
  assertContains(html, "<header>", "header");
});

// State & Reactivity
console.log("\n--- State & Reactivity ---\n");

test("state: declares reactive variable", () => {
  const html = runForWeb('state count "0"\np { text "Count: $count" }');
  assertContains(html, 'data-bind="count"', "data-bind");
  assertContains(html, ">0</span>", "initial value");
});

test("state: bootstrap script", () => {
  const html = runForWeb('state count "0"\np { text "$count" }');
  assertContains(html, 'var __s=', "state object");
  assertContains(html, '__set', "set function");
});

test("state: non-reactive var not wrapped", () => {
  const html = runForWeb('set x "hello"\np { text "$x" }');
  assertNotContains(html, "data-bind", "no data-bind");
  assertContains(html, ">hello</p>", "substituted");
});

// Events
console.log("\n--- Events ---\n");

test("on_click: generates onclick", () => {
  const html = runForWeb('state count "0"\nbutton { text "+"; on_click { set count "1" } }');
  assertContains(html, "onclick=", "has onclick");
  assertContains(html, "__set", "calls __set");
});

test("on_click: with expr", () => {
  const html = runForWeb('state count "0"\nbutton { text "+"; on_click { set count expr "$count + 1" } }');
  assertContains(html, "onclick=", "has onclick");
  assertContains(html, "eval(", "evaluates expr");
});

// Style
console.log("\n--- Style ---\n");

test("style: generates CSS", () => {
  const html = runForWeb('style { ".app" { padding 24px; background "#000" } }');
  assertContains(html, ".app {", "selector");
  assertContains(html, "padding: 24px;", "property");
  assertContains(html, "background:", "has background");
});

// Nesting
console.log("\n--- Nesting ---\n");

test("nested elements", () => {
  const html = runForWeb('div { class "wrap"; h1 { text "Title" }; p { class "desc"; text "Hello" } }');
  assertContains(html, '<div class="wrap"><h1>Title</h1><p class="desc">Hello</p></div>', "nested");
});

test("deeply nested", () => {
  const html = runForWeb('div { class "a"; div { class "b"; span { class "c"; text "deep" } } }');
  assertContains(html, '<div class="a"><div class="b"><span class="c">deep</span></div></div>', "deep nesting");
});

// Integration
console.log("\n--- Integration ---\n");

test("counter app", () => {
  const html = runForWeb(`
    state count "0"
    div { class "app";
      p { text "Count: $count" };
      button { class "btn"; text "+"; on_click { set count expr "$count + 1" } };
      button { class "btn"; text "-"; on_click { set count expr "$count - 1" } }
    }
  `);
  assertContains(html, 'class="app"', "app div");
  assertContains(html, 'data-bind="count"', "count binding");
  assertContains(html, "onclick=", "buttons have onclick");
  assertContains(html, 'class="btn"', "button classes");
});

test("full HTML document", () => {
  const html = runForWeb('div { text "Hello" }');
  assertContains(html, "<!DOCTYPE html>", "doctype");
  assertContains(html, '<meta charset="UTF-8">', "charset");
  assertContains(html, '<div id="app">', "app div");
  assertContains(html, "<style>", "style block");
});

console.log(
  `\n=== Web Library Results: ${passed} passed, ${failed} failed ===\n`,
);

if (failed > 0) process.exit(1);
