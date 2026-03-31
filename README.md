# khem / ▲{■}

A minimalist, homoiconic scripting language for building interactive interfaces.

Everything is a command. Code is data. No boilerplate.

## Quick Start

```html
<script type="module" src="./khem.js"></script>
<script type="text/khem">
  state count "0"

  div { class "app";
    h1 { text "Counter" };
    p { text "Count: $count" };
    button { text "+"; on_click { set count expr "$count + 1" } }
  }

  style {
    ".app" { max-width 400px; margin "0 auto"; padding 2rem }
  }
</script>
```

Compiles to reactive HTML. `$count` auto-updates in the DOM when state changes.

## Syntax

Khem has three token types:

```
word        — contiguous non-special chars
"string"    — double-quoted, supports $var substitution, \" escape
{block}     — braced, literal (no substitution), passed as string
```

Separators:
```
;           — command separator
\n          — command separator
#           — comment (to end of line)
```

```khem
# This is a comment
text "hello"; text "world"
text "line one"
text "line two"
```

### Variables

```khem
set name "Erik"
text "Hello $name"           # → Hello Erik
```

`$var` substitutes the variable value. If not found, `$var` is left literal.

### Blocks

```khem
div { class "app"; text "content" }
```

`{...}` is a literal string — no substitution inside. The block is passed to the command, which decides how to handle it.

## Standard Library

### Variables
```
set name value              — assign variable
```

### Control Flow
```
if condition { body }                       — conditional
if condition { body } else { other }        — if/else
for var start end { body }                  — numeric loop
foreach var list { body }                   — iterate space-separated list
match value { pattern { body } ... }        — pattern matching
```

### Procedures
```
proc name {params} { body }                 — define procedure
proc name {param; param "default"} { body } — with defaults
return value                                — return from proc
```

```khem
proc greet {name; greeting "Hello"} {
  text "$greeting, $name!"
}

greet "Erik"                # → Hello, Erik!
greet "Erik" "Hey"          # → Hey, Erik!
```

### Strings
```
text value                  — return string
string length str           — string length
string index str i          — char at index
string range str from to    — substring
string toupper str          — uppercase
string tolower str          — lowercase
string trim str             — trim whitespace
string match str pattern    — wildcard match (*, ?)
replace str old new         — replace all occurrences
contains str sub            — 1 if contains
starts-with str prefix      — 1 if starts with
ends-with str suffix        — 1 if ends with
upper str                   — shorthand for toupper
lower str                   — shorthand for tolower
trim str                    — shorthand for string trim
slice str from to           — substring
```

### Lists (space-separated strings)
```
list a b c                  — create list "a b c"
llength list                — number of items
lindex list i               — item at index
lappend list item           — append item
concat a b                  — concatenate
join list separator         — join with separator
```

### Math
```
expr expression             — evaluate math expression
incr var ?amount            — increment variable
abs n | round n | floor n | ceil n | sqrt n
max a b ... | min a b ...
```

### Comparison & Logic
```
eq a b | neq a b            — equal / not equal
gt a b | lt a b | gte a b | lte a b
not a | and a b | or a b
```

### Dictionary
```
dict create key val ...     — create key-value pairs
dict get d key              — get value
dict set d key val          — set value
```

### Error Handling
```
try { body } catch { handler }  — try/catch
throw message                   — throw error
```

### Date & Time
```
today                       — current date (YYYY-MM-DD)
clock                       — current time (locale string)
clock seconds               — unix timestamp
```

### File
```
include "file.kh"           — include and evaluate another .kh file
```

## Web Primitives

The web layer provides 5 core primitives in JS. Everything else is defined in Khem.

### elem — Create Element

```khem
elem "div" { class "app"; text "content" }
```

Evaluates the body block. Commands like `class` and `id` set attributes on the element. Content commands (`text`, nested `elem`) produce the body.

### attr — Set Attribute

```khem
div { class "container"; id "main"; data-theme "dark" }
```

`attr` sets an attribute on the enclosing `elem`. Any command name that isn't recognized as a known command becomes an attribute setter inside an elem context.

### on — Event Handler

```khem
button { text "click me"; on "click" { set count expr "$count + 1" } }
```

Compiles the body to JavaScript and generates `onclick='...'`.

### state — Reactive State

```khem
state count "0"
state name "Erik"
```

Declares a reactive variable. `$count` in text becomes a DOM binding that auto-updates when state changes.

### style — CSS

```khem
style {
  ".app" {
    max-width 420px
    margin "0 auto"
    padding 2rem
  }
  ".btn:hover" {
    background var(--acc)
  }
}
```

CSS in Khem syntax. Property names and values separated by spaces. Blocks become `{...}` in CSS.

## Web Procs (web.kh)

User-facing commands defined in Khem itself. You can read, modify, or extend them.

### HTML Tags

```khem
div { body }          span { body }
p { body }            h1 { body } ... h6 { body }
ul { body }           ol { body }         li { body }
table { body }        tr { body }         td { body }    th { body }
section { body }      main { body }       header { body }  footer { body }
nav { body }          article { body }    form { body }
pre { body }          code { body }       blockquote { body }
strong { body }       em { body }         button { body }
br                    hr
```

### Special Elements

```khem
a "/path" { class "link"; text "Click" }      # link with href
img "/photo.jpg" "description"                 # image
input { id "name"; type "text"; placeholder "Enter..." }
```

### Attribute Helpers

```khem
class "name"            id "my-id"
data "key" "value"      href "/path"
src "/img.png"          type "text"
value "hello"           placeholder "Enter..."
```

### Event Helpers

```khem
on_click { body }       on_input { body }
on_change { body }      on_submit { body }
on_keydown { body }
```

## Reactive Example

```khem
state count "0"

div { class "app";
  h1 { text "Counter" };
  p { text "Value: $count" };
  button { text "+"; on_click { set count expr "$count + 1" } };
  button { text "-"; on_click { set count expr "$count - 1" } };
  button { text "reset"; on_click { set count "0" } }
}

style {
  ".app" {
    display flex
    flex-direction column
    align-items center
    gap "1rem"
    padding "2rem"
  }
}
```

Output:
```html
<div class="app">
  <h1>Counter</h1>
  <p>Value: <span data-bind="count">0</span></p>
  <button onclick='__set("count", ...)'>+</button>
  <button onclick='__set("count", ...)'>-</button>
  <button onclick='__set("count", "0")'>reset</button>
</div>
<script>
var __s={"count":"0"};
function __set(k,v){__s[k]=v;
document.querySelectorAll('[data-bind="'+k+'"]').forEach(function(e){e.textContent=v;});
}
</script>
```

## CLI

```bash
khem build app.kh              # compile to HTML (stdout)
khem watch app.kh              # rebuild on change
khem serve app.kh [port]       # serve over HTTP
khem repl                      # interactive REPL
khem test                      # run test suite
```

## Browser Usage

```html
<script type="module">
  import { renderForWeb } from './khem.js';
  document.body.innerHTML = renderForWeb(`
    div { class "app";
      h1 { text "Hello" };
      p { text "Built with Khem" }
    }
  `);
</script>
```

Or with script tags:

```html
<script type="text/khem">
  div { class "app"; h1 { text "Hello from Khem!" } }
</script>
```

## Project Structure

```
khem/
├── src/
│   ├── index.js          # Entry point, exports, web.kh loader
│   ├── web.kh            # User-facing web procs (div, span, class, etc.)
│   ├── core/
│   │   ├── parser.js     # Text → AST tokenizer
│   │   └── engine.js     # AST evaluator & scoping
│   └── plugins/
│       ├── stdlib.js     # Standard library (if, for, proc, set, ...)
│       └── web.js        # Web primitives (elem, attr, on, state, style)
├── bin/khem.js           # CLI
├── tests/                # Test suites
├── examples/             # Example .kh files
└── docs/                 # Language docs
```

## Design Principles

- **Homoiconic**: Code is data. Every statement is a list.
- **Minimal core**: Parser + engine + 5 web primitives. Everything else is Khem.
- **No build step required**: Works in browser with `<script type="text/khem">`.
- **Zero dependencies**: Pure JavaScript, no external packages.
- **Reactive by default**: `state` + `$var` = automatic DOM updates.
