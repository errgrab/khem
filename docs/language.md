# Khem Language Reference

Khem is a minimalist, Tcl-inspired glue language for scripting and web development.

## Core Syntax

Everything is a **command** with **arguments** separated by whitespace:

```tcl
command arg1 arg2 arg3
```

### Strings

```tcl
# Double quotes - variable substitution
set name "World"
puts "Hello, $name!"

# Braces - no substitution (literal)
set code { puts "$name" }  # $name is NOT substituted
```

### Command Substitution

Use `[command]` to capture command output:

```tcl
set result [expr 2 + 3]
puts "2 + 3 = $result"
```

### Blocks

Braces `{}` create literal strings (no substitution). Commands that execute code expect blocks:

```tcl
if $condition { puts "true" }
proc greet { who } { puts "Hello, $who!" }
```

## Variables

```tcl
# Set a variable
set x 42
set name "Khem"

# Use a variable
puts $x        # 42
puts "$name"   # Khem
```

## Control Flow

### if/else

```tcl
if $x > 0 {
  puts "positive"
} else {
  puts "not positive"
}
```

### for

```tcl
for i 1 10 {
  puts $i
}
```

### foreach

```tcl
foreach item "a b c" {
  puts $item
}
```

### match (pattern matching)

```tcl
set x "hello"
match $x {
  "hello" { puts "greeting" }
  "bye" { puts "farewell" }
  default { puts "other" }
}
```

## Procedures

```tcl
proc greet { who } {
  puts "Hello, $who!"
}

greet "World"
```

With return value:

```tcl
proc square { x } {
  return [expr $x * $x]
}

set result [square 5]  # 25
```

## Lists

```tcl
# Create a list
set items [list apple banana cherry]

# Length
llength $items       # 3

# Index
lindex $items 1      # "banana"

# Append
lappend items "date"
```

## String Operations

```tcl
set msg "Hello, World!"

string toupper $msg    # "HELLO, WORLD!"
string tolower $msg    # "hello, world!"
string length $msg     # 12
string index $msg 0    # "H"
string range $msg 0 4  # "Hello"
string trim $msg       # "Hello, World!"
```

## Math (expr)

```tcl
expr 2 + 3        # 5
expr 10 * 5       # 50
expr 100 / 3      # 33.333...
expr 10 % 3       # 1
```

## Dictionary

```tcl
set d [dict create name "John" age "30"]
dict get $d name   # "John"
dict set $d city "NYC"
```

## Comparison

```tcl
eq $a $b      # equal
neq $a $b     # not equal
gt $a $b      # greater than
lt $a $b      # less than
gte $a $b     # greater than or equal
lte $a $b     # less than or equal
```

## Logic

```tcl
not $x         # logical NOT
and $x $y      # logical AND
or $x $y       # logical OR
```

## Web Commands (web.js)

See [web.md](web.md) for web-specific commands.

## Events

```tcl
# Emit an event
emit "clicked" "button1"

# Listen to events
on "clicked" {
  puts "Got: $data"
}
```
