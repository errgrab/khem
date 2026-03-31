import { parse } from "../src/core/parser.js";
import { evaluate, createScope } from "../src/core/engine.js";
import { loadStdLib } from "../src/plugins/stdlib.js";
import { loadWebLib, generateHTML } from "../src/plugins/web.js";

function runForWeb(code) {
  try {
    const env = { cmds: {}, vars: {}, _state: {} };
    loadStdLib(env);
    loadWebLib(env);
    env._source = code;
    const scope = createScope();
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

console.log("\n=== Web Library Tests ===\n");

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

test("state: declares variable", () => {
  const html = runForWeb('state count "0"\np { text "Count: $count" }');
  assertContains(html, '__s["count"]', "state variable in render");
  assertContains(html, "Count:", "text content");
});

test("state: bootstrap script", () => {
  const html = runForWeb('state count "0"\np { text "$count" }');
  assertContains(html, 'var __s=', "state object");
  assertContains(html, 'function render()', "render function");
  assertContains(html, '__r()', "re-render function");
});

test("state: non-reactive var also substituted", () => {
  const html = runForWeb('set x "hello"\np { text "$x" }');
  assertContains(html, ">hello</p>", "substituted");
});

// Events
console.log("\n--- Events ---\n");

test("on_click: generates onclick", () => {
  const html = runForWeb('state count "0"\nbutton { text "+"; on_click { set count "1" } }');
  assertContains(html, "onclick=", "has onclick");
  assertContains(html, "__s[", "updates state");
});

test("on_click: with expr", () => {
  const html = runForWeb('state count "0"\nbutton { text "+"; on_click { set count expr "$count + 1" } }');
  assertContains(html, "onclick=", "has onclick");
  assertContains(html, "eval(", "evaluates expr");
  assertContains(html, "__r()", "triggers render");
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
  assertContains(html, 'class=\\"app\\"', "app div in render");
  assertContains(html, "Count:", "count label");
  assertContains(html, "onclick=", "buttons have onclick");
  assertContains(html, 'class=\\"btn\\"', "button classes");
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
