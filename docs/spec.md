# Khem Language Specification v0.3

## 1. Design Philosophy

- **Everything is a string**: All values are strings
- **Code is data**: Statements are nested lists
- **Command-based**: Operations are commands with string arguments
- **Minimal core**: Parser + engine + 5 web primitives
- **Reactive**: State changes update the DOM granularly

## 2. Lexical Elements

### 2.1 Tokens

| Token | Description |
|-------|-------------|
| `word` | Contiguous non-special characters |
| `"string"` | Double-quoted, supports `$var` and `\"` escapes |
| `{block}` | Braced literal, no substitution inside |
| `[cmd]` | Command substitution |

### 2.2 Special Characters

| Char | Meaning |
|------|---------|
| `"..."` | String literal (with substitution) |
| `{...}` | Block literal (no substitution) |
| `[...]` | Command substitution |
| `$name` | Variable substitution |
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

## 4. Core Commands (stdlib)

### 4.1 Variables

```khem
set name value
```

### 4.2 Control Flow

```khem
if condition { body }
if condition { body } else { other }
for var start end { body }
foreach var list { body }
match value { pattern { body } default { body } }
```

### 4.3 Procedures

```khem
proc name {params} { body }
proc name {param; param "default"} { body }
return value
```

### 4.4 String Operations

`text`, `string` (subcommands: `length`, `index`, `range`, `trim`, `toupper`, `tolower`, `match`), `replace`, `contains`, `starts-with`, `ends-with`, `upper`, `lower`, `trim`, `slice`, `concat`, `join`.

### 4.5 Lists

`list`, `llength`, `lindex`, `lappend`, `concat`, `join`.

### 4.6 Math

`expr`, `incr`, `abs`, `round`, `floor`, `ceil`, `sqrt`, `max`, `min`.

### 4.7 Comparison & Logic

`eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `not`, `and`, `or`.

### 4.8 Dictionary

`dict create`, `dict get`, `dict set`.

### 4.9 Error Handling

`try { body } catch { handler }`, `throw message`.

### 4.10 File

```khem
include "file.kh"
```

## 5. Web Primitives

### 5.1 elem

```khem
elem "tag" { body }
```

Creates an HTML element. Inside the body block:

- `class "name"` → sets class attribute
- `id "name"` → sets id attribute
- `attr "key" "value"` → sets any attribute
- `on "event" { body }` → binds event handler
- `text "content"` → text content
- Nested `elem` calls → child elements

### 5.2 attr

```khem
attr "key" "value"
```

Sets an attribute on the enclosing `elem`. Outside elem context, returns attribute string.

### 5.3 on

```khem
on "click" { set count expr "$count + 1" }
```

Compiles body to JavaScript, generates `onclick='...'`.

Supported events: `click`, `input`, `change`, `submit`, `keydown`, etc.

### 5.4 state

```khem
state name "default"
```

Declares a reactive variable. `$name` in `text` becomes a DOM binding:

```html
<span data-bind="name">default</span>
```

When `set name "new"` is called, all `[data-bind="name"]` elements update.

### 5.5 style

```khem
style {
  .app {
    max-width 420px
    margin 0 auto
    padding 2rem
  }
  .btn:hover {
    background var(--acc)
  }
}
```

CSS in Khem syntax. Blocks become `{...}`, commands become `property: value;`.

## 6. Reactivity Model

1. `state x "0"` → registers reactive variable
2. `text "Count: $x"` → wraps `$x` in `<span data-bind="x">0</span>`
3. `set x "1"` → updates `__s.x`, finds all `[data-bind="x"]`, sets `textContent`
4. Non-reactive `set y "hello"` → normal variable, no DOM binding

Generated bootstrap script:
```javascript
var __s = {"x": "0"};
function __set(k, v) {
  __s[k] = v;
  document.querySelectorAll('[data-bind="'+k+'"]').forEach(function(e) {
    e.textContent = v;
  });
}
```

## 7. Web Procs (web.kh)

All HTML tags and helpers are defined as Khem procs:

```khem
proc div {body} { elem "div" "$body" }
proc span {body} { elem "span" "$body" }
proc class {name} { attr "class" "$name" }
proc id {name} { attr "id" "$name" }
proc on_click {body} { on "click" "$body" }
# ... 40+ more
```

Users can read, modify, or add their own procs.

## 8. Generated HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>/* from style{} blocks */</style>
</head>
<body>
  <div id="app"><!-- evaluated output --></div>
  <script>/* reactive state bootstrap (if state used) */</script>
</body>
</html>
```
