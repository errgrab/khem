# Khem Language Specification (Draft)

> A minimalist, homoiconic glue language inspired by Tcl.

## 1. Core Philosophy

- **Everything is a string**: All values are strings; commands manipulate strings.
- **Code is data**: The syntax is a simple nested list of words, making the language easy to parse, transform, and extend.
- **Command-based**: All operations are performed by calling commands with arguments.
- **Simple substitution**: Variables are substituted with `$var` syntax.
- **Blocks**: Braces `{}` group commands into blocks.

## 2. Lexical Structure

### 2.1 Words
A **word** is a contiguous sequence of characters that is not a space, tab, newline, semicolon, or comment starter. Words are separated by whitespace or semicolons.

### 2.2 Quoting
- **Double quotes `"`**: Group characters into a single word, with variable substitution (`$var`) and command substitution (not supported yet). Escapes: `\"` and `\\`.
- **Braces `{}`**: Group characters into a single word, but **no substitution** is performed inside. Used for blocks (lists of commands) and literal strings.

### 2.3 Comments
A comment starts with `#` and continues to the end of the line.

### 2.4 Separators
- Whitespace (space, tab) separates words.
- Newline or semicolon `;` separates commands.

## 3. Syntax

### 3.1 Commands
A command is a list of words:
```
command argument1 argument2 ...
```
The first word is the command name; the rest are arguments. Arguments are separated by whitespace.

### 3.2 Blocks
A block is a list of commands enclosed in braces:
```
{ command1 args ; command2 args }
```
Blocks are passed as arguments to commands (e.g., `if`, `for`, `proc`).

### 3.3 Variable Substitution
A variable reference `$var` is replaced by the value of the variable `var`. Variable names consist of letters, digits, underscores, and hyphens. Substitution occurs inside double-quoted words and outside braces.

Example:
```
set name "World"
puts "Hello $name!"
```

### 3.4 Command Substitution (Future)
Not implemented yet. Future: `[command args]` would be replaced by the result of the command.

## 4. Data Types

All data is represented as strings. However, commands can interpret strings as:

- **Numbers**: strings that can be parsed as integers or floats.
- **Lists**: space-separated strings (items may be quoted if they contain spaces). Use `list` command to construct lists.
- **Dictionaries**: lists of alternating key-value pairs (each key and value is a string). Use `dict` commands to manipulate.

## 5. Core Commands

### 5.1 Variable Commands
- `set varName ?value?` — Set variable `varName` to `value` (or return its value if `value` omitted).
- `unset varName` — Remove variable.

### 5.2 Control Flow
- `if condition script ?else script?` — Conditionally execute script.
- `for start condition next body` — C-style for loop.
- `foreach var list body` — Iterate over list items.
- `while condition body` — Loop while condition is true.
- `switch string clauses` — Pattern matching (like `match`).
- `return ?value?` — Return from current proc.
- `break` — Break out of loop.
- `continue` — Continue to next iteration.

### 5.3 Procedure Definition
- `proc name params body` — Define a procedure. `params` is a list of parameter names (may include defaults).

### 5.4 List Commands
- `list ?item ...?` — Create a list from items.
- `llength list` — Return length of list.
- `lindex list index` — Return element at index.
- `lrange list first last` — Return sublist.
- `lappend listVar ?item ...?` — Append items to list variable.
- `linsert listVar index ?item ...?` — Insert items at index.
- `lreplace listVar first last ?item ...?` — Replace slice.
- `lsort ?options? list` — Sort list.

### 5.5 Dictionary Commands
- `dict create ?key value ...?` — Create dictionary.
- `dict get dictionary key` — Get value for key.
- `dict set dictionaryKey value` — Set key-value pair.
- `dict exists dictionary key` — Test if key exists.
- `dict keys dictionary` — Return list of keys.
- `dict values dictionary` — Return list of values.

### 5.6 String Commands
- `string length string` — Length of string.
- `string index string index` — Character at index.
- `string range string first last` — Substring.
- `string match ?-nocase? pattern string` — Pattern matching.
- `string map mapping string` — Character mapping.
- `string trim ?chars? string` — Trim characters.
- `string toupper string` — Convert to uppercase.
- `string tolower string` — Convert to lowercase.

### 5.7 Math Commands
- `expr expression` — Evaluate arithmetic expression (supports +, -, *, /, %, parentheses).
- `incr varName ?increment?` — Increment integer variable.
- `abs number` — Absolute value.
- `round number` — Round to nearest integer.
- `floor number` — Floor.
- `ceil number` — Ceiling.
- `sqrt number` — Square root.
- `max number ...` — Maximum.
- `min number ...` — Minimum.

### 5.8 I/O Commands
- `puts ?-nonewline? string` — Write string to stdout (or console).
- `gets stdin ?varName?` — Read line from stdin.
- `read fileId ?size?` — Read from channel.
- `write fileId string` — Write to channel.

### 5.9 Miscellaneous
- `eval script` — Evaluate script as commands.
- `source fileName` — Source a file.
- `exit ?code?` — Exit with code.
- `clock seconds` — Current time.
- `clock format time` — Format time.
- `clock scan string` — Parse time.

## 6. Environment

The runtime environment consists of:
- **Variables**: a dictionary mapping variable names to string values.
- **Commands**: a dictionary mapping command names to command implementations (JavaScript functions).
- **Stack**: a stack of scopes for procedure calls.

## 7. Evaluation Model

1. Parse source into a list of commands (each command is a list of words).
2. For each command:
   - Perform variable substitution on each word (except inside braces).
   - Look up command name in command dictionary.
   - Call command implementation with arguments (strings).
   - Capture result (string) as command output.
3. Blocks are evaluated when the enclosing command requests it (e.g., `if` evaluates its block if condition is true).

## 8. Error Handling

- **Parse errors**: malformed syntax (unmatched braces, unterminated quotes).
- **Runtime errors**: unknown command, wrong number of arguments, invalid operations.
- Errors can be caught with `try` command (future).

## 9. Extensions

The core language is minimal. Additional functionality can be added via:
- **Commands**: implement new commands in JavaScript and register them.
- **Libraries**: write Khem scripts that define new procedures.

## 10. Example

```
# Hello World
set name "World"
puts "Hello $name!"

# Define a procedure
proc greet { who } {
  puts "Greetings, $who!"
}

greet "Earth"

# List manipulation
set fruits [list apple banana cherry]
puts "Number of fruits: [llength $fruits]"
```

Note: Command substitution `[...]` not yet implemented; use `eval` or separate commands.

## 11. Future Considerations

- Command substitution.
- Namespaces.
- Object-oriented extensions.
- Concurrency primitives.
- Foreign function interface.

---

This specification is a starting point and will evolve as the language matures.