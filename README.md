# khem

A homoiconic scripting language that compiles to self-contained HTML. No runtime, no dependencies — just one `.html` file.

## Quick Start

```khem
set count "0"
div { class "app"; p { text "Count: $count" }; button { text "+"; on_click { set count expr "$count + 1" } } }
style { .app { padding 2rem } }
```

```bash
khem build app.kh   # → app.html (self-contained)
```

Open `app.html` in a browser. That's it.

## Syntax

Three token types:

```
word          — contiguous non-special chars
"string"      — double-quoted, supports $var substitution, \" \\ \n \t \$ escapes
{block}       — braced literal, no substitution inside
```

Separators:

```
; or \n       — command separator
#             — comment (to end of line)
```

```khem
# This is a comment
text "hello"; text "world"
```

### Variables

```khem
set name "Erik"
text "Hello $name"           # → Hello Erik
text "Cost: \$price"         # → Cost: $price (escaped)
```

### Blocks

```khem
div { class "app"; text "content" }
```

`{...}` is a literal string passed to the command. The command decides how to interpret it.

## Web Commands

### Elements

```khem
div { class "container"; p { text "hello" } }
span { id "title"; text "Hi" }
a { href "https://example.com"; text "Link" }
img { src "photo.jpg"; attr "alt" "Photo" }
br
hr
```

All standard HTML tags work directly: `div`, `span`, `p`, `h1`–`h6`, `ul`, `ol`, `li`, `table`, `tr`, `td`, `th`, `section`, `main`, `header`, `footer`, `nav`, `article`, `form`, `pre`, `code`, `blockquote`, `strong`, `em`, `button`, `input`.

### Attributes

```khem
div { class "box"; id "main"; attr "data-value" "42" }
```

`class`, `id`, `href`, `src`, `type`, `value`, `placeholder` are built-in. Use `attr "key" "value"` for anything else.

### Text

```khem
p { text "Hello $name, you have $count items" }
```

### Events

```khem
button { text "Click me"; on_click { set count expr "$count + 1" } }
input { type "text"; on_input { set query "$event.target.value" } }
```

Events: `on_click`, `on_input`, `on_change`, `on_submit`, `on_keydown`. Also `on "eventname" { ... }`.

### Style

```khem
style {
  .app { max-width 420px; margin 0 auto; padding 2rem }
  .btn:hover { background var(--acc) }
}
```

CSS in Khem syntax. Nested blocks become `{...}`, commands become `property: value;`.

The design system variables (defined in `style.md`) are available as CSS custom properties: `--bg`, `--fg`, `--acc`, `--border`, etc.

## State and Reactivity

```khem
state count "0"
p { text "Count: $count" }
button { text "+"; on_click { set count expr "$count + 1" } }
```

`state name "default"` declares a reactive variable. When you `set` it, every place that references `$name` updates in the DOM automatically — no manual DOM manipulation needed.

```khem
state name "World"
state items "3"
p { text "Hello $name" }
p { text "You have $items items" }
button { text "Add"; on_click { set items expr "$items + 1" } }
```

## Control Flow

```khem
if $condition { text "yes" }
if $x { text "positive" } else { text "zero" }
for i 1 10 { p { text "Line $i" } }
foreach item "a b c" { li { text "$item" } }
match $value { "a" { text "Alpha" } "b" { text "Beta" } default { text "Other" } }
```

## Procedures

```khem
proc greet {name; greeting "Hello"} {
  p { text "$greeting, $name!" }
}
greet "Erik"              # → Hello, Erik!
greet "Erik" "Hey"        # → Hey, Erik!
```

## Standard Library

**Variables:** `set`

**Control flow:** `if`, `for`, `foreach`, `match`

**Procedures:** `proc`, `return`

**Strings:** `string length`, `string index`, `string range`, `string trim`, `string toupper`, `string tolower`, `string match`, `replace`, `trim`, `upper`, `lower`, `slice`, `contains`, `starts-with`, `ends-with`

**Lists:** `list`, `llength`, `lindex`, `lappend`, `concat`, `join`

**Math:** `expr`, `incr`, `abs`, `round`, `floor`, `ceil`, `sqrt`, `max`, `min`

**Comparison:** `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `not`, `and`, `or`

**Dictionary:** `dict create`, `dict get`, `dict set`

**Date/Time:** `today`, `clock`

**Error handling:** `try { } catch { }`, `throw`

**Files:** `include "file.kh"`

## CLI

```bash
khem build <file.kh>         # Build to HTML (auto-detect web mode)
khem serve <file.kh> [port]  # Dev server with live reload (default: 4173)
khem watch <file.kh>         # Watch and rebuild on change
khem repl                    # Interactive REPL
khem run <file.kh>           # Run a script (stdout)
khem test                    # Run test suite
khem ide [dir] [port]        # Serve the built-in IDE
```

## Project Structure

```
khem/
├── bin/khem.js          # CLI entry point
├── src/
│   ├── index.js         # Public API (run, renderForWeb, compile)
│   ├── compiler.js      # AST → { html, css, js } compiler
│   ├── core/
│   │   ├── parser.js    # Tokenizer + parser
│   │   └── engine.js    # Evaluator + scope system
│   └── plugins/
│       ├── stdlib.js    # Core commands (set, if, for, proc, etc.)
│       └── web.js       # Web commands (elem, attr, on, style, state)
├── examples/            # Example .kh files
├── tests/               # Test suites
├── style.md             # Design system (CSS variables)
└── docs/spec.md         # Language specification
```

## Example: Shift Calendar

```khem
state month "4"
state year "2026"
state d1 "0"; state d2 "0"; state d3 "0"

div { class "app";
  div { class "header";
    span { class "logo"; text "Escala" };
    span { class "sub"; text "Calendário de Turnos" }
  };
  div { class "cal";
    div { class "grid";
      if "$d1" "0" { span { class "cell"; on_click { set d1 "76" }; text "1" } }
      else { span { class "cell cell-1"; on_click { set d1 "0" }; text "L" } }
    }
  }
}

style {
  .app { max-width 420px; margin 40px auto }
  .cell { aspect-ratio 1; display flex; align-items center; justify-content center; cursor pointer }
  .cell-1 { background var(--green-dim); color var(--green) }
}
```

See `examples/escala.kh` for the full version.
