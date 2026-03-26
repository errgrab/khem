# New Web Library Plan

## Overview
Create a simplified, KISS web library for Khem that follows the style.md design system and injects itself into HTML for static site hosting.

## Architecture

### Core Principles
1. **Static-first**: Everything works on static hosting (GitHub Pages, Netlify, etc.)
2. **Hash-based routing**: `#/path` for client-side navigation
3. **Reactive state**: Simple state changes trigger re-renders
4. **Inject and go**: Single `khem.run(code)` returns complete HTML with embedded runtime

### Command Structure

```tcl
# Page definition
page "home" {
  component "header" {}
  div "container" { ... }
}

# Route mapping
route "#/" "home"
route "#/about" "about"

# Component definition
component "header" {
  h1 "logo" { text "My App" }
}

# State management
state count 0
state items [list a b c]

# Event system
emit "clicked" "data"
on "clicked" { puts "Got event" }

# Styling (follows style.md)
style {
  ".container" { padding 16px }
}
```

## Files to Create/Modify

### 1. `src/plugins/web.js` (NEW - complete rewrite)
- `page(name, body)` - Define a page
- `route(hash, pageName)` - Map routes to pages
- `component(name, body)` - Define reusable component
- `state(name, initial)` - Reactive state variable
- `emit(event, data)` - Emit custom event
- `on(event, handler)` - Listen to events
- `style(rules)` - Add CSS following style.md
- HTML tag commands (div, span, p, h1-h6, button, input, textarea, select, etc.)

### 2. `src/index.js` (modify)
- Import and load web library
- Export `runForWeb(code)` that returns complete HTML

### 3. `bin/khem.js` (modify)
- Update `build` and `serve` commands to use web runtime
- Add `--web` flag for web compilation

### 4. `examples/web-counter.kh` (new example)
- Counter app using new web commands
- Demonstrates state, component, styling

## Runtime Injection Strategy

The `run()` function will:
1. Parse the Khem code
2. Extract pages, components, routes, styles
3. Generate an HTML shell with:
   - Embedded CSS from style.md defaults + custom styles
   - The component HTML
   - A minimal JavaScript runtime (< 2KB)
   - Route initialization script

```html
<!DOCTYPE html>
<html>
<head>
  <title>...</title>
  <style>
    /* style.md defaults */
    :root { ... }
    body { ... }
    /* custom styles */
  </style>
</head>
<body>
  <div id="app">
    <!-- Rendered content -->
  </div>
  <script>
    // Minimal runtime
    const Khem = { state: {}, routes: {}, ... };
  </script>
</body>
</html>
```

## Style.md Integration

Default styles will be embedded automatically:
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

## Simplified Reactive Model

```javascript
// State changes trigger re-render of affected components
state.count = 5; // Automatically re-renders components using count

// Components are functions that return HTML
function renderHeader() {
  return `<h1>${state.title}</h1>`;
}
```

## Example Usage

```tcl
# counter.kh - New simplified syntax
page "counter" {
  state count 0
  
  style {
    ".container" { padding 24px }
    ".display" { font-size 48px }
  }
  
  div "container" {
    p "display" { text $count }
    button { text "-" } on "click" { set count [expr $count - 1] }
    button { text "+" } on "click" { set count [expr $count + 1] }
  }
}

route "#/" "counter"
```

## Implementation Order

1. Create new web.js with minimal HTML tag commands
2. Add state management (simple object with change notification)
3. Add component system (register and render)
4. Add page/route system (hash-based navigation)
5. Create runtime injection in index.js
6. Update bin/khem.js for web builds
7. Create working example
8. Test on static hosting
