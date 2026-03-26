# Khem Web Library

The web library enables building static web applications with Khem.

## Overview

Khem web apps use:
- **Hash-based routing** (`#/path`) for client-side navigation
- **Reactive state** that triggers DOM updates
- **Components** for reusable UI elements
- **Embedded scripts** in HTML files

## Commands

### page

Define a page that can be routed to:

```tcl
page "home" {
  div "container" {
    h1 "" { text "Welcome" }
    p "" { text "Hello, World!" }
  }
}
```

### route

Map a hash URL to a page:

```tcl
route "#/" "home"
route "#/about" "about"
```

### title

Set the page title:

```tcl
title "My App"
```

### state

Declare a reactive state variable:

```tcl
state count 0
state items [list a b c]
state name "World"
```

### set

Update a state variable (triggers re-render):

```tcl
set count 5
set name "Khem"
```

### style

Add CSS styles (follows style.md design system):

```tcl
style {
  ".container" { padding 24px }
  ".display" { font-size 48px }
  button { border-radius 4px }
}
```

### include

Include another .kh file (for multi-file projects):

```tcl
include "./pages/counter.kh"
include "./pages/about.kh"
```

### emit

Emit an event with data:

```tcl
emit "clicked" "button-id"
emit "dataReady" "some data"
```

### on

Listen for an event:

```tcl
on "clicked" {
  puts "Button clicked: $data"
}
```

## HTML Tags

All standard HTML tags are available as commands:

```tcl
# Format: tag "class" { content }
div "container" { ... }
p "text-class" { text "Hello" }
span "badge" { text "NEW" }
h1 "" { text "Title" }
h2 "" { text "Subtitle" }

# Button
button "btn-class" { text "Click me" }

# Link
a "#/about" "link-class" { text "About" }

# List
ul "" {
  li "" { text "Item 1" }
  li "" { text "Item 2" }
}

# Table
table "" {
  tr "" {
    td "" { text "Cell 1" }
    td "" { text "Cell 2" }
  }
}
```

### Special Tags

- `input "class" "attrs"` - Input element
- `textarea "class" "attrs" "value"` - Textarea
- `select "class" "attrs" { options }` - Select dropdown
- `img "class" "src=..."` - Image
- `br` - Line break
- `hr` - Horizontal rule

## Example: Counter App

```tcl
title "Counter"
state count 0

page "home" {
  style {
    ".app" { padding 24px; text-align center }
    ".count" { font-size 72px; font-family var(--serif) }
    ".controls" { display flex; gap 12px; justify-content center }
  }

  div "app" {
    p "count" { text $count }
    
    div "controls" {
      button "" { text "-" }
      button "" { text "+" }
    }
  }
}

route "#/" "home"
```

Build with:
```bash
khem build counter.kh -o counter.html
```

## Example: Multi-File Project

**app.kh** (main file):
```tcl
title "My Site"

page "home" {
  h1 "" { text "Welcome" }
  ul "" {
    li "" { a "#/counter" "" { text "Counter Demo" } }
    li "" { a "#/about" "" { text "About" } }
  }
}

route "#/" "home"

include "./pages/counter.kh"
include "./pages/about.kh"
```

**pages/counter.kh**:
```tcl
state count 0

page "counter" {
  div "counter-page" {
    p "" { text [concat "Count: " $count] }
    button "" { text "Increment" }
  }
}

route "#/counter" "counter"
```

**pages/about.kh**:
```tcl
page "about" {
  div "about-page" {
    h1 "" { text "About" }
    p "" { text "Built with Khem!" }
  }
}

route "#/about" "about"
```

## Embedded Scripts

Use `<script type="text/khem">` to embed Khem in HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Embedded Khem</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400&display=swap" rel="stylesheet">
</head>
<body>
  <div class="card">
    <h2>Math Demo</h2>
    <script type="text/khem">
      p "" { text [concat "2 + 2 = " [expr 2 + 2]] }
      p "" { text [concat "10 * 5 = " [expr 10 * 5]] }
    </script>
  </div>
</body>
</html>
```

Process with:
```bash
khem build page.html -o output.html
```

## Design System (style.md)

Khem follows a dark-first design system with CSS variables:

```css
:root {
  --bg: #0a0a0a;
  --s0: #101010;
  --s1: #161616;
  --s2: #1e1e1e;
  --s3: #262626;
  --border: #272727;
  --b2: #333333;
  --fg: #d4d0c8;
  --fg1: #aaaaaa;
  --fg2: #888888;
  --fg3: #555555;
  --dim: #484848;
  --acc: #c8a84b;
  --acc-dim: #7a6628;
  --green: #6b9e78;
  --green-dim: #2a4a33;
  --red: #a86b6b;
  --red-dim: #4a2222;
  --blue: #7a8fa8;
  --blue-dim: #2a3a4a;
  --amber: #d4924a;
  --mono: 'DM Mono', 'Fira Mono', ui-monospace, monospace;
  --serif: 'Instrument Serif', Georgia, serif;
}
```
