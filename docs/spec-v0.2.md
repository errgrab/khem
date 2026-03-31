# Khem Language Specification v0.2

_Status: Draft — Phase 1 stabilization_

---

## 1. Design Principles

- **Homoiconic:** code is data. Every expression is a list.
- **Uniform:** one syntax for everything. `command arg arg {block}`.
- **Minimal:** smallest set of primitives that compose.
- **Portable:** the language spec is independent of any backend (HTML, WASM, etc).
- **Honest:** errors are visible. No silent failures.

---

## 2. Lexical Structure

### 2.1 Tokens

| Token        | Syntax         | Description                                      |
|--------------|----------------|--------------------------------------------------|
| Word         | `foo`          | Bare identifier / command name                   |
| String       | `"hello"`      | Double-quoted string, `\` escapes                |
| Block        | `{ ... }`      | Unevaluated braced group (code-as-data)           |
| Subst        | `[cmd args]`   | Evaluated inline — result replaces the bracket   |
| Variable     | `$name`        | Variable interpolation (inside strings/blocks)   |
| Comment      | `# ...`        | Line comment, discarded at parse time            |
| Separator    | newline, `;`   | Separates commands                               |

### 2.2 String Escapes

| Sequence | Meaning        |
|----------|----------------|
| `\"`     | Literal quote  |
| `\\`     | Literal backslash |
| `\n`     | Newline        |
| `\t`     | Tab            |
| `\$`     | Literal dollar (no interpolation) |

### 2.3 Rules

- Commands are separated by newlines or semicolons.
- `{...}` blocks are passed as **unevaluated strings** to the command. The command decides whether to parse/evaluate them.
- `[...]` substitution is evaluated immediately and its result replaces the bracket expression as an argument.
- `$var` inside strings and blocks is substituted at evaluation time.
- `#` starts a comment that extends to end of line. Comments are not passed to commands.

---

## 3. Data Model

### 3.1 Values

All values are strings. There are no types at the language level.

| Kind     | Internal    | Example               | Notes                              |
|----------|-------------|-----------------------|------------------------------------|
| String   | `string`    | `"hello"`             | Default. All values are strings.   |
| Nil      | `""`        | empty string          | Falsy.                             |

### 3.2 Lists

Lists are strings. The canonical representation uses braces as outer delimiters and quotes for elements containing spaces:

```
set items [list "hello world" "foo bar"]
puts $items               → {"hello world" "foo bar"}
list:index $items 0       → "hello world"
list:index $items 1       → "foo bar"
list:length $items        → 2
```

**Parsing rules:**
- A list string is parsed by scanning for `{"..." "..." ...}` structure.
- Elements without spaces don't need quotes: `{a b c}` → 3 elements.
- Elements with spaces must be quoted: `{"a b" c}` → 2 elements.
- Nested lists use nested braces: `{a {b c} d}` → 3 elements, second is a sub-list.
- Empty list: `{}` → 0 elements.
- A bare string without braces is treated as a single-element list by `list:*` commands.

**Why strings:** everything is a string. Lists are a *convention* — the string has a structure that list commands know how to parse. This is how Tcl does it. No new types, no complexity, but full expressiveness.

### 3.3 Truthiness

| Value         | Truthy? |
|---------------|---------|
| `""`          | No      |
| `"0"`         | No      |
| `"false"`     | No      |
| anything else | Yes     |

---

## 4. Commands (Built-in)

### 4.1 Variables

| Command                    | Description                              |
|----------------------------|------------------------------------------|
| `set name value`           | Assign variable in current scope         |
| `get name`                 | Return value of variable (or empty)      |

### 4.2 Output

| Command                    | Description                              |
|----------------------------|------------------------------------------|
| `puts args...`             | Print to stdout / console                |
| `text value`               | Return value (identity — used in web)    |

### 4.3 Control Flow

| Command                              | Description                        |
|--------------------------------------|------------------------------------|
| `if condition {then} ?else {else}`   | Conditional. `?else` is optional.  |
| `for var start end {body}`           | Numeric loop (inclusive)           |
| `foreach var list {body}`            | Iterate over list or space-sep     |
| `match value {pat {body}} ...`       | Pattern matching. `default` catch-all |
| `while condition {body}`             | Loop while condition is truthy     |

### 4.4 Definitions

| Command                          | Description                              |
|----------------------------------|------------------------------------------|
| `def name {params} {body}`       | Define a procedure (command)             |
| `lambda {params} {body}`         | Anonymous procedure, returns callable    |
| `return value`                   | Early return from def/lambda             |

**`def` parameter syntax:**

```
def greet {name} {
  puts "hello $name"
}

def card {title; desc; type "default"} {
  # semicolon separates required from optional params
  # type has default value "default"
}
```

- Params before `;` are required.
- Params after `;` are optional (with default values).
- Missing optional params get their default or empty string.

### 4.5 Lists

| Command                        | Description                                    |
|--------------------------------|------------------------------------------------|
| `list args...`                 | Create a new list                              |
| `list:length lst`              | Number of elements                             |
| `list:index lst n`             | Element at index n                             |
| `list:append lst values...`    | Return new list with values appended           |
| `list:prepend lst values...`   | Return new list with values prepended          |
| `list:join lst separator`      | Join list elements into a string               |
| `list:split string separator`  | Split string into a list                       |
| `list:range lst from to`       | Sub-list from index from to to (inclusive)     |
| `list:sort lst`                | Return sorted copy                             |
| `list:reverse lst`             | Return reversed copy                           |
| `list:contains lst value`      | Return "1" if value is in list                 |
| `list:find lst value`          | Return index of value (-1 if not found)        |
| `list:remove lst value`        | Return new list without first occurrence       |
| `list:flatten lst`             | Flatten nested lists                           |
| `list:map lst var {body}`      | Map function over list                         |
| `list:filter lst var {body}`   | Filter list by predicate                       |
| `list:reduce lst var acc {body}`| Reduce list to single value                  |

### 4.6 String Operations

| Command                        | Description                                    |
|--------------------------------|------------------------------------------------|
| `string:length str`            | Character count                                |
| `string:index str n`           | Character at position n                        |
| `string:range str from to`     | Substring                                      |
| `string:trim str`              | Remove leading/trailing whitespace             |
| `string:toupper str`           | Uppercase                                      |
| `string:tolower str`           | Lowercase                                      |
| `string:replace str old new`   | Replace all occurrences                        |
| `string:contains str sub`      | "1" if substring found                         |
| `string:starts-with str sub`   | "1" if string starts with substring            |
| `string:ends-with str sub`     | "1" if string ends with substring              |
| `string:split str sep`         | Split into list (alias for list:split)         |
| `string:format template args`  | `%s`-style formatting                          |

### 4.7 Math

| Command              | Description                           |
|----------------------|---------------------------------------|
| `expr expression`    | Evaluate arithmetic expression        |
| `incr var ?amount`   | Increment variable (default +1)       |
| `abs n`              | Absolute value                        |
| `round n`            | Round to nearest integer              |
| `floor n`            | Round down                            |
| `ceil n`             | Round up                              |
| `sqrt n`             | Square root                           |
| `max args...`        | Maximum                               |
| `min args...`        | Minimum                               |

### 4.8 Comparison & Logic

| Command        | Description            |
|----------------|------------------------|
| `eq a b`       | Equal                  |
| `neq a b`      | Not equal              |
| `gt a b`       | Greater than           |
| `lt a b`       | Less than              |
| `gte a b`      | Greater or equal       |
| `lte a b`      | Less or equal          |
| `not a`        | Logical not            |
| `and a b`      | Logical and            |
| `or a b`       | Logical or             |

### 4.9 Dictionaries

| Command                        | Description                           |
|--------------------------------|---------------------------------------|
| `dict:create key val ...`      | Create dict from key-value pairs      |
| `dict:get d key`               | Get value for key                     |
| `dict:set d key val`           | Set key to value, return new dict     |
| `dict:keys d`                  | Return list of keys                   |
| `dict:has d key`               | "1" if key exists                     |
| `dict:remove d key`            | Return new dict without key           |
| `dict:size d`                  | Number of pairs                       |

### 4.10 Date & Time

| Command            | Description                             |
|--------------------|-----------------------------------------|
| `today`            | Current date as `YYYY-MM-DD`            |
| `clock`            | Formatted datetime string               |
| `clock:seconds`    | Unix timestamp in seconds               |

### 4.11 Evaluation

| Command                          | Description                              |
|----------------------------------|------------------------------------------|
| `eval string`                    | Parse and evaluate string as code         |
| `parse string`                   | Parse string, return AST as list          |
| `quote {code}`                   | Return code unevaluated (identity on block) |
| `unquote value`                  | Force evaluation of a quoted value        |

### 4.12 Error Handling

Khem uses a **dual-return** model inspired by Go. Commands that can fail return two values: `{result error}`. On success, error is empty. On failure, result is empty and error describes what went wrong.

```
set {content err} [read "file.txt"]
if $err {
  puts "failed: $err"
} else {
  puts "got: $content"
}
```

**Conventions:**
- Commands that always succeed return a single value (no error).
- Commands that may fail return `{result error}`.
- The caller destructures with `set {a b} [cmd ...]`.
- If you ignore the error, it's your responsibility: `set content [lindex [read "file.txt"] 0]`.
- No exceptions, no panics, no try/catch. Errors are values.

| Command                          | Description                              |
|----------------------------------|------------------------------------------|
| `assert condition ?message`      | Error (fatal) if condition is falsy      |
| `error message`                  | Create an error value: `{"" message}`    |

### 4.13 I/O & System

| Command                          | Description                              |
|----------------------------------|------------------------------------------|
| `read file`                      | Read file contents (string)              |
| `write file content`             | Write string to file                     |
| `exists path`                    | "1" if path exists                       |
| `import file`                    | Load and evaluate a .kh file             |
| `env name`                       | Read environment variable                |
| `args`                           | Command-line arguments as list           |
| `exit ?code`                     | Exit with code (default 0)               |

### 4.14 Metaprogramming

| Command                          | Description                              |
|----------------------------------|------------------------------------------|
| `commands`                       | List all registered command names        |
| `exists:cmd name`                | "1" if command is defined                |
| `source cmd`                     | Return the source body of a def          |

---

## 5. Scoping

### 5.1 Rules

1. **`set`** creates/assigns in the **current scope**.
2. **`def`** creates a command in the **current scope** (usually global).
3. **`def` body** gets a new child scope. Parameters are bound in that scope.
4. **`for`, `foreach`, `while`** body gets a new child scope. Loop variable is local.
5. **`if`** body does NOT create a new scope (it inherits the caller's scope).
6. **`lambda`** captures its defining scope (closure).

### 5.2 Variable Lookup

Walk up the scope chain. First match wins.

```
set x "outer"
def test {
  puts $x        → "outer" (found in parent)
  set x "inner"
  puts $x        → "inner" (local shadow)
}
test
puts $x          → "outer" (unchanged)
```

---

## 6. Web Library

The web library is a **plugin**, not core language. It registers commands that compile to HTML/CSS/JS.

### 6.1 Document Structure

| Command                          | Description                              |
|----------------------------------|------------------------------------------|
| `document "title" {body}`        | Define a full HTML document              |
| `page name {body}`               | Named page (for routing)                 |
| `route hash page`                | Map URL hash to page                     |
| `title "text"`                   | Set `<title>`                            |
| `style {css-block}`              | Add CSS rules                            |
| `script {js-block}`              | Add JavaScript code                      |
| `include file`                   | Include another .kh file                 |

### 6.2 HTML Tags

All standard HTML tags are registered as commands. First string argument is class, rest are children.

```
div "container" {
  h1 "title" { text "Hello" }
  p "intro" { text "World" }
}
```

Generates: `<div class="container"><h1 class="title">Hello</h1><p class="intro">World</p></div>`

**Special tags:**

| Command                              | Behavior                                   |
|--------------------------------------|--------------------------------------------|
| `a href class {body}`                | First arg is href, rest follow normal rules |
| `img src alt`                        | Self-closing                               |
| `br`, `hr`                           | Self-closing, no args                      |
| `input id class attrs`               | Flexible arg count                         |

### 6.3 Output

```
renderForWeb(code) → HTML string
```

The web library accumulates styles, scripts, pages. `renderForWeb` assembles the final HTML document.

---

## 7. Backend Architecture

### 7.1 Current (Phase 1)

```
Khem source → Parser → AST → Engine evaluates → HTML string
```

- Parser: `src/core/parser.js`
- Engine: `src/core/engine.js`
- StdLib: `src/plugins/stdlib.js`
- WebLib: `src/plugins/web.js`

### 7.2 Future (Phase 2+)

```
Khem source → Parser → AST → Compiler → WASM bytecode
                                              ↓
                                        Runtime (host)
                                    (browser / desktop / embedded)
```

- Parser stays the same.
- Engine becomes a **compiler** that emits WASM instructions.
- StdLib becomes WASM host imports.
- WebLib becomes one of many possible host modules.

---

## 8. Migration from v0.1

### Breaking Changes

| v0.1             | v0.2             | Reason                            |
|------------------|------------------|-----------------------------------|
| `proc`           | `def`            | Simpler, more standard            |
| `list` returns space-sep string | `list` returns `{"elem1" "elem2"}` | Structured string representation |
| `try/catch`      | removed          | Dual-return error model (Go-style) |
| `throw`          | `error`          | Returns error value, doesn't panic |
| `include` (Node only) | `import` (portable) | Works in all backends       |
| `match` (string parsing hack) | `match` (proper args) | Reliable parsing      |
| `expr` (eval hack) | `expr` (proper evaluator) | No `new Function()`    |

### Deprecation Path

1. v0.2 accepts both `proc` and `def` (proc logs warning).
2. v0.3 removes `proc`.
3. v0.1 list format (space-separated) auto-converted on read.

---

## 9. Examples

### Hello World

```
puts "Hello, World!"
```

### Component

```
def card {title; desc; type "default"} {
  div "card $type" {
    h3 "" { text $title }
    p "" { text $desc }
  }
}

card "System Status" "All nodes operational." "success"
```

### Loop

```
for i 1 10 {
  puts "iteration $i"
}
```

### List Processing

```
set fruits [list "apple" "banana" "cherry"]
puts $fruits            → {"apple" "banana" "cherry"}
list:length $fruits     → 3
list:index $fruits 1    → "banana"

set items [list "hello world" "foo bar"]
list:index $items 0     → "hello world"
list:index $items 1     → "foo bar"
```

### List Mapping

```
set fruits [list "apple" "banana" "cherry"]
list:map $fruits f {
  puts "I like $f"
}
```

### Error Handling (Go-style)

```
def divide {a; b} {
  if [eq $b "0"] {
    return [error "division by zero"]
  }
  return [expr $a / $b]
}

set {result err} [divide 10 0]
if $err {
  puts "Error: $err"
} else {
  puts "Result: $result"
}
```

### File Reading with Error

```
set {content err} [read "config.txt"]
if $err {
  puts "Could not read config: $err"
  exit 1
}
puts "Config loaded: [string:length $content] bytes"
```

### Match

```
set color "red"
match $color {
  red   { puts "fire" }
  blue  { puts "water" }
  green { puts "earth" }
  default { puts "unknown" }
}
```

### Web Page

```
document "My Site" {
  style {
    .hero { padding 48px 0 }
    .hero h1 { font-size 36px; color var(--acc) }
  }

  div hero {
    h1 "" { text "Welcome" }
    p "" { text "Built with Khem." }
  }
}
```

---

## 10. Open Questions

- [ ] Should `list:map` / `list:filter` accept lambda or block?
- [ ] Should `import` be eager or lazy?
- [ ] Should the compiler emit source maps for debugging?
- [ ] Should there be a module system (`export` / `import` names)?
- [ ] Should `eval` be sandboxed (no I/O access)?

---

_Spec maintained by ErikG. Last updated: 2026-03-30._
