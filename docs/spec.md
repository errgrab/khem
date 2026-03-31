# Khem Language Specification v1.0

## 1. Design Philosophy

- **Everything is a string**: All values are strings
- **Code is data**: Statements are nested lists
- **Command-based**: Operations are commands with string arguments
- **Compiler**: Khem compiles to self-contained HTML + CSS + JS. No runtime.
- **Reactive**: State changes update the DOM granularly via diff

## 2. Lexical Elements

### 2.1 Tokens

| Token | Description |
|-------|-------------|
| `word` | Contiguous non-special characters |
| `"string"` | Double-quoted, supports `$var` substitution and escapes |
| `{block}` | Braced literal, no substitution inside |
| `[cmd]` | Command substitution — nested expression evaluated at parse time |

### 2.2 Special Characters

| Char | Meaning |
|------|---------|
| `"..."` | String literal (with `$var` substitution) |
| `{...}` | Block literal (no substitution) |
| `[...]` | Command substitution |
| `$name` | Variable substitution inside strings |
| `;` | Command separator |
| `\n` | Command separator |
| `#` | Comment (to end of line) |

### 2.3 Escape Sequences (inside strings)

| Sequence | Result |
|----------|--------|
| `\"` | Literal double quote |
| `\\` | Literal backslash |
| `\n` | Newline |
| `\t` | Tab |
| `\$` | Literal dollar sign (prevents variable substitution) |

```khem
set price 100
text "Cost: \$price"              # → Cost: $price (literal)
text "Total: $price"              # → Total: 100 (substituted)
text "He said \"hello\""          # → He said "hello"
```

## 3. Syntax

### 3.1 Commands

```
command arg1 arg2 { block }
```

A command is a name followed by arguments. Arguments can be words, strings, or blocks.

### 3.2 Separators

Commands are separated by `;` or newline:

```khem
set x "hello"; set y "world"
# or
set x "hello"
set y "world"
```

### 3.3 Blocks

`{...}` is passed as a literal string to the command. The command decides how to interpret it:

```khem
if $x { puts "true" }       # if receives block string, evaluates it
div { class "app" }          # div receives block string, evaluates with elem context
```

### 3.4 Variable Substitution

`$name` is replaced with the variable's value. If not found, left literal:

```khem
set name "Erik"
text "Hello $name"           # → Hello Erik
text "$unknown"              # → $unknown
```

### 3.5 Command Substitution

`[cmd args]` evaluates the command and substitutes its return value:

```khem
text "Length: [string length "hello"]"   # → Length: 5
```

## 4. Standard Library

### 4.1 Variables

```khem
set name value              # Assign variable
```

### 4.2 Control Flow

```khem
if condition { body }                       # Conditional
if condition { body } else { other }        # If/else
for var start end { body }                  # Numeric loop (inclusive)
foreach var list { body }                   # Iterate space-separated list
match value { pattern { body } ... }        # Pattern matching
```

`match` supports multiple patterns and `default`:

```khem
match $x {
  "a" { text "Alpha" }
  "b" { text "Beta" }
  default { text "Other" }
}
```

### 4.3 Procedures

```khem
proc name {params} { body }                         # Define procedure
proc name {param; param "default"} { body }          # With defaults
return value                                        # Return from proc
```

```khem
proc greet {name; greeting "Hello"} {
  text "$greeting, $name!"
}
greet "Erik"                # → Hello, Erik!
greet "Erik" "Hey"          # → Hey, Erik!
```

### 4.4 String Operations

| Command | Description |
|---------|-------------|
| `string length S` | Character count |
| `string index S N` | Character at position N |
| `string range S N ?M` | Substring from N to M (inclusive) |
| `string trim S` | Trim whitespace |
| `string toupper S` | Uppercase |
| `string tolower S` | Lowercase |
| `string match PATTERN S` | Glob match (`*`, `?`), returns `"1"` or `"0"` |
| `replace S OLD NEW` | Replace all occurrences |
| `trim S` | Trim whitespace |
| `upper S` | Uppercase |
| `lower S` | Lowercase |
| `slice S N ?M` | Substring |
| `contains S SUB` | Returns `"1"` if S contains SUB |
| `starts-with S PREFIX` | Returns `"1"` if S starts with PREFIX |
| `ends-with S SUFFIX` | Returns `"1"` if S ends with SUFFIX |

### 4.5 Lists

Lists are space-separated strings.

| Command | Description |
|---------|-------------|
| `list A B C` | Create list |
| `llength LIST` | Count items |
| `lindex LIST N` | Item at index N |
| `lappend VAR A B` | Append items to variable |
| `concat A B` | Concatenate |
| `join LIST SEP` | Join with separator |

### 4.6 Math

| Command | Description |
|---------|-------------|
| `expr EXPR` | Evaluate arithmetic expression |
| `incr VAR ?AMT` | Increment variable (default 1) |
| `abs N` | Absolute value |
| `round N` | Round |
| `floor N` | Floor |
| `ceil N` | Ceiling |
| `sqrt N` | Square root |
| `max A B ...` | Maximum |
| `min A B ...` | Minimum |

`expr` evaluates JavaScript arithmetic. Use `$var` for variable references:

```khem
set x "10"
text "[expr $x * 2 + 1]"   # → 21
```

### 4.7 Comparison & Logic

| Command | Description |
|---------|-------------|
| `eq A B` | Equal (`"1"` / `"0"`) |
| `neq A B` | Not equal |
| `gt A B` | Greater than (numeric) |
| `lt A B` | Less than |
| `gte A B` | Greater or equal |
| `lte A B` | Less or equal |
| `not A` | Logical not |
| `and A B` | Logical and |
| `or A B` | Logical or |

### 4.8 Dictionary

Dictionaries are space-separated key-value pairs.

| Command | Description |
|---------|-------------|
| `dict create K1 V1 K2 V2` | Create dictionary |
| `dict get DICT KEY` | Get value |
| `dict set DICT KEY VAL` | Set value (returns new dict) |

### 4.9 Date/Time

| Command | Description |
|---------|-------------|
| `today` | Current date (YYYY-MM-DD) |
| `clock` | Current date/time string |
| `clock seconds` | Unix timestamp |

### 4.10 Error Handling

```khem
try { body } catch { handler }    # Try/catch
throw "message"                    # Throw error
```

Inside `catch`, the variable `error` contains the error message.

### 4.11 File Inclusion

```khem
include "file.kh"
```

Includes and evaluates another khem file. Circular includes are detected and skipped.

## 5. Web Layer

### 5.1 elem

```khem
elem "tag" { body }
```

Creates an HTML element. Inside the body block:

```khem
class "name"                    # → class="name"
id "name"                       # # → id="name"
attr "key" "value"              # → key="value"
href "url"                      # → href="url"
src "url"                       # → src="url"
type "text"                     # → type="text"
value "val"                     # → value="val"
placeholder "hint"              # → placeholder="hint"
data "key" "value"              # → data-key="value"
text "content"                  # → text content
on "event" { body }             # → event handler
```

### 5.2 HTML Tag Shorthand

All standard HTML tags work directly as commands:

```
div span p h1 h2 h3 h4 h5 h6 ul ol li
table tr td th section main header footer
nav article form pre code blockquote
strong em button input a br hr img
```

```khem
div { class "app"; p { text "hello" } }
# equivalent to:
elem "div" { class "app"; elem "p" { text "hello" } }
```

### 5.3 Attributes

```khem
class "name"                    # class attribute
id "name"                       # id attribute
href "url"                      # link href
src "url"                       # image/source src
type "text"                     # input type
value "val"                     # input value
placeholder "hint"              # input placeholder
data "key" "value"              # data-* attribute
attr "key" "value"              # any attribute
```

### 5.4 a (Link)

```khem
a { href "https://example.com"; text "Click here" }
```

The `a` command automatically sets `href` from its first argument.

### 5.5 img

```khem
img { src "photo.jpg"; attr "alt" "Description" }
# or shorthand:
img "photo.jpg" "Description"
```

### 5.6 Events

```khem
on "click" { set count expr "$count + 1" }
on_click { set count expr "$count + 1" }
on_input { set query "$event.target.value" }
on_change { set selected "$event.target.value" }
on_submit { set submitted "true" }
on_keydown { set key "$event.key" }
```

Event handlers compile to inline JavaScript. The handler body is compiled to JS statements, and `__r()` (re-render) is appended automatically.

Supported events: `click`, `input`, `change`, `submit`, `keydown`, and any DOM event via `on "eventname" { ... }`.

### 5.7 state

```khem
state name "default"
```

Declares a reactive variable with an initial value. See section 6 for the reactivity model.

### 5.8 style

```khem
style {
  .selector {
    property value
    property value
  }
  .selector:hover {
    property value
  }
}
```

CSS blocks in Khem syntax. The compiler converts them to standard CSS:

- Nested blocks become `selector { ... }`
- Commands become `property: value;`
- Supports pseudo-classes and combinators

See `style.md` for the design system CSS variables (`--bg`, `--fg`, `--acc`, `--border`, etc.).

### 5.9 Design System Variables

The following CSS custom properties are available (defined in `style.md`):

**Backgrounds:** `--bg`, `--s0`, `--s1`, `--s2`, `--s3`

**Borders:** `--border`, `--b2`

**Foreground:** `--fg`, `--fg1`, `--fg2`, `--fg3`, `--dim`

**Accents:** `--acc`, `--acc-dim`, `--green`, `--green-dim`, `--red`, `--red-dim`, `--blue`, `--blue-dim`, `--amber`

**Fonts:** `--mono` (DM Mono), `--serif` (Instrument Serif)

## 6. Compiler

Khem compiles source code to a self-contained HTML file with three targets:

| Target | Description |
|--------|-------------|
| HTML | Static structure rendered at compile time |
| CSS | From `style { }` blocks |
| JS | State management, reactivity, event handlers |

### 6.1 Compilation Pipeline

```
Source (.kh)
  → Parser (tokenize + parse → AST)
  → Compiler (AST → { html, css, js })
  → Output (.html)
```

### 6.2 Static vs Reactive

Elements without state references are rendered as static HTML at compile time. Elements that reference `state` variables get reactivity bindings — the initial render is still static HTML, but the JS runtime can update it.

### 6.3 Event Compilation

Event handlers compile to inline JS. For example:

```khem
button { text "+"; on_click { set count expr "$count + 1" } }
```

Compiles to:

```html
<button onclick="__s[&quot;count&quot;]=String((function(){try{return eval(&quot;Number(__s[\&quot;count\&quot;])+1&quot;)}catch{return 0}})());__r()">+</button>
```

The `__r()` call triggers a re-render after the state change.

### 6.4 Proc Compilation

Procedures compile to JavaScript functions:

```khem
proc greet {name} { p { text "Hello $name" } }
```

Compiles to:

```javascript
function greet(name){return "<p>Hello "+name+"</p>"}
```

## 7. Reactivity Model

### 7.1 State Declaration

```khem
state count "0"
state name "World"
```

Declares reactive variables with initial values. All `state` declarations are collected into a state object.

### 7.2 State Access

In `text` commands, `$var` is substituted. If `var` is a state variable, the substitution happens at render time:

```khem
state count "0"
p { text "Count: $count" }
# → <p>Count: 0</p>
```

### 7.3 State Mutation

`set` updates state and triggers re-render:

```khem
set count expr "$count + 1"
```

In event handlers, `set` compiles to JS that:
1. Updates the state object
2. Calls `__r()` to trigger re-render

### 7.4 Re-render

The re-render cycle:
1. `render()` is called, producing new HTML string
2. A temporary DOM element is created with the new HTML
3. `__diff()` compares the current DOM with the new one
4. Only changed nodes are updated

### 7.5 DOM Diff

The diff algorithm:
- Preserves scroll position, focus, and animations
- Compares node types, attributes, and text content
- Recursively diffs children
- Adds/removes children as needed
- Does not destroy unmodified DOM nodes

## 8. Generated Output Structure

A compiled `.kh` file produces:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* CSS from style { } blocks */
    /* Design system variables from style.md */
  </style>
</head>
<body>
  <div id="app">
    <!-- Compiled HTML (static elements) -->
  </div>
  <script>
    // State object
    var __s = { count: "0", name: "World" };

    // Proc functions
    function greet(name) { return "<p>Hello " + name + "</p>"; }

    // Render function (returns HTML string)
    function render() { return "<div>..." + __s.count + "...</div>"; }

    // DOM diff algorithm
    function __diff(a, b) { /* recursive diff */ }

    // Re-render trigger
    function __r() {
      var t = document.createElement('div');
      t.innerHTML = render();
      __diff(document.getElementById('app'), t);
    }

    // Initial render
    document.getElementById('app').innerHTML = render();
  </script>
</body>
</html>
```

The output is fully self-contained. No external dependencies. The browser has no knowledge of Khem — it just runs the generated JS.

## 9. Showcase: Escala (Shift Calendar)

`examples/escala.kh` is a shift calendar app that demonstrates:

- **31 reactive state variables** (one per day)
- **Complex event handlers** with expr arithmetic for cycling shift types
- **Conditional rendering** (if/else for cell styling based on shift type)
- **Computed statistics** (summing shifts with expr)
- **CSS design system** variables for dark theme
- **Month navigation** with computed days-in-month
- **Full interactivity** — click cells to cycle: empty → L194 → N220 → Folga → empty

It compiles to a single self-contained HTML file with no runtime or dependencies.
