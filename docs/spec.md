# Khem Language Specification

Khem is a minimalist, homoiconic scripting language inspired by Tcl.

## 1. Design Philosophy

- **Everything is a string**: All values are strings; commands manipulate strings
- **Code is data**: Code structure is simple nested lists
- **Command-based**: All operations are commands with string arguments
- **Minimal**: Small core, extensible via commands
- **Glue language**: Designed for scripting and web development

## 2. Lexical Elements

### 2.1 Tokens

- **WORD**: A contiguous sequence of non-whitespace, non-special characters
- **STRING**: Characters enclosed in double quotes `"..."`
- **BLOCK**: Characters enclosed in braces `{...}` (literal, no substitution)
- **CMD**: Characters enclosed in brackets `[...]` (command substitution)

### 2.2 Special Characters

| Character | Meaning |
|-----------|---------|
| `"..."`   | String literal (with substitution) |
| `{...}`   | Block literal (no substitution) |
| `[...]`   | Command substitution |
| `$name`   | Variable substitution |
| `;`       | Command separator |
| `\n`      | Command separator |
| `#`       | Comment (to end of line) |

### 2.3 Whitespace

- Spaces and tabs separate words
- Newlines and semicolons separate commands

## 3. Syntax

### 3.1 Commands

```
command argument1 argument2 ...
```

The first word is the command name; remaining words are arguments.

### 3.2 Blocks

```
{
  command1 args
  command2 args
}
```

Blocks are literal strings. Commands that execute code parse their block arguments.

### 3.3 Variable Substitution

```
$variable
```

Replaced with the variable's value. Only in double-quoted strings and words.

### 3.4 Command Substitution

```
[command args]
```

Replaced with the command's output.

## 4. Evaluation

1. Parse input into a list of commands
2. For each command:
   - Evaluate command substitution `[...]`
   - Substitute variables `$name`
   - Look up command in environment
   - Call command with arguments
   - Collect output

## 5. Types

All values are strings. Commands interpret strings as needed:

- **Numbers**: Strings parseable as integers/floats
- **Lists**: Space-separated strings
- **Booleans**: Non-empty, non-"0", non-"false" strings are truthy

## 6. Core Commands

### 6.1 Variables

| Command | Description |
|---------|-------------|
| `set name value` | Set variable |
| `unset name` | Remove variable |

### 6.2 Control Flow

| Command | Description |
|---------|-------------|
| `if cond { body }` | Conditional |
| `if cond { body } else { body }` | Conditional with else |
| `for var start end { body }` | Counting loop |
| `foreach var list { body }` | List iteration |
| `match val { p1 { b1 } p2 { b2 } }` | Pattern matching |
| `return value` | Return from proc |
| `break` | Break from loop |
| `continue` | Continue to next iteration |

### 6.3 Procedures

| Command | Description |
|---------|-------------|
| `proc name { params } { body }` | Define procedure |

### 6.4 Lists

| Command | Description |
|---------|-------------|
| `list item1 item2 ...` | Create list |
| `llength list` | List length |
| `lindex list index` | Get item at index |
| `lappend listVar item` | Append to list |
| `concat str1 str2 ...` | Concatenate strings |
| `join list separator` | Join list items |

### 6.5 String Operations

| Command | Description |
|---------|-------------|
| `string toupper str` | Uppercase |
| `string tolower str` | Lowercase |
| `string length str` | String length |
| `string index str pos` | Character at position |
| `string range str start end` | Substring |
| `string trim str` | Trim whitespace |
| `contains str needle` | Check if contains |
| `starts-with str prefix` | Check prefix |
| `ends-with str suffix` | Check suffix |
| `replace str old new` | Replace all occurrences |
| `slice str start end` | Substring |

### 6.6 Math

| Command | Description |
|---------|-------------|
| `expr expression` | Evaluate arithmetic |
| `incr var ?amount?` | Increment variable |
| `abs n` | Absolute value |
| `round n` | Round |
| `floor n` | Floor |
| `ceil n` | Ceiling |
| `sqrt n` | Square root |
| `max a b ...` | Maximum |
| `min a b ...` | Minimum |

### 6.7 Comparison

| Command | Description |
|---------|-------------|
| `eq a b` | Equal |
| `neq a b` | Not equal |
| `gt a b` | Greater than |
| `lt a b` | Less than |
| `gte a b` | Greater or equal |
| `lte a b` | Less or equal |
| `not x` | Logical NOT |
| `and x y` | Logical AND |
| `or x y` | Logical OR |

### 6.8 Dictionary

| Command | Description |
|---------|-------------|
| `dict create key val ...` | Create dictionary |
| `dict get dict key` | Get value |
| `dict set dict key val` | Set value |
| `dict keys dict` | Get keys |
| `dict values dict` | Get values |

### 6.9 I/O

| Command | Description |
|---------|-------------|
| `puts string` | Print to stdout |

### 6.10 Error Handling

| Command | Description |
|---------|-------------|
| `throw message` | Throw error |
| `try { body } catch { body }` | Try/catch |

### 6.11 Web Commands

| Command | Description |
|---------|-------------|
| `title text` | Set page title |
| `state name value` | Declare state variable |
| `page name { body }` | Define a page |
| `route hash page` | Map route to page |
| `style { css }` | Add CSS |
| `include file.kh` | Include another file |
| `emit event data` | Emit event |
| `on event { body }` | Listen to event |

## 7. Standard Library

The standard library is loaded automatically. Web commands are available when using web mode.

## 8. Compilation

```bash
khem build app.kh          # Compile to HTML
khem build page.html       # Process embedded scripts
khem serve app.kh          # Serve with live reload
khem watch app.kh          # Watch and rebuild
khem repl                  # Interactive REPL
khem run app.kh            # Run script
```

## 9. Examples

See [examples/](../examples/) for working examples.
