# Web Library Fix Plan

## Root Cause
The page body is stored as raw Khem code (`div "app" { text $count }`), not pre-rendered HTML (`<div class="app">$count</div>`). The client-side `render()` does `$var` substitution on raw Khem, which doesn't produce valid HTML.

## Fix 1: Store Pre-rendered HTML Templates
- In `generateHTML()`, pre-render each page to HTML at build time
- Store HTML with `$var` placeholders: `<div class="app">$count</div>`
- Client `render()` does simple string substitution on HTML

## Fix 2: Complete CSS Defaults (from style.md)
```css
:root {
  --bg: #0a0a0a; --s0: #101010; --s1: #161616; --s2: #1e1e1e; --s3: #262626;
  --border: #272727; --b2: #333333;
  --fg: #d4d0c8; --fg1: #aaaaaa; --fg2: #888888; --fg3: #555555; --dim: #484848;
  --acc: #c8a84b; --acc-dim: #7a6628;
  --green: #6b9e78; --green-dim: #2a4a33;
  --red: #a86b6b; --red-dim: #4a2222;
  --blue: #7a8fa8; --blue-dim: #2a3a4a;
  --amber: #d4924a;
}
button { /* style.md: default transparent, border, fg2 */ }
button:hover { /* border b2, text fg */ }
input { /* bg s1, border, fg, padding 8px 10px */ }
input:focus { border-color: var(--acc); }
```

## Fix 3: Input with Auto-bind
Syntax: `input "count"` or `input "" "data-bind=count"`
- Generate: `<input class="field" data-bind="count" value="0">`
- Client: oninput updates S[name], re-renders

## Fix 4: Client-side Render
```javascript
function render() {
  var hash = location.hash || "#/";
  var page = R[hash];
  if (!page) return;
  var html = P[page]; // Pre-rendered HTML with $vars
  // Simple substitution
  html = html.replace(/\$([a-zA-Z_]+)/g, function(m, k) {
    return S[k] !== undefined ? S[k] : m;
  });
  document.getElementById("app").innerHTML = html;
}
```

## Files to Modify
- `src/plugins/web.js` - Fix generateHTML, add input binding, complete CSS
- `examples/counter.kh` - Verify works with buttons

## Test Cases
1. Counter: click +/- updates number
2. Counter: Reset sets to 0
3. Inputs: typing updates state
4. Styling: dark theme, proper colors
