# khem / (▲){■}

**Khem** ("The Black Land") is a minimalist, homoiconic scripting language and UI compiler. It is designed to transform high-density logic into optimized HTML/CSS structures while maintaining a unified syntax for both backend compilation and frontend DOM manipulation.

The project is architected to be environment-agnostic, running natively in **Node.js** for static site generation or directly in the **Browser** as a lightweight client-side runtime.

---

## 1. Core Philosophy

* **Homoiconic**: Code is data. Every statement is a list, making the language incredibly easy to parse, transform, and extend.
* **Modular Architecture**: The core evaluator is separated from the "Standard Library" and "Web Plugins."
* **Minimalist Aesthetic**: Built for the Khem design system—dark-first, information-dense, and typographically driven.
* **Zero-Dependency**: The core engine is pure JavaScript with no external overhead.

---

## 2. Project Structure

```text
khem-lang/
├── src/
│   ├── index.js          # Main entry (loads stdlib + web plugins)
│   ├── core/
│   │   ├── parser.js     # Text-to-AST Tokenizer
│   │   └── engine.js     # AST Evaluator & Scoping Logic
│   └── plugins/
│       ├── stdlib.js     # Control flow (if, for, proc, set)
│       └── web.js        # DOM elements, CSS compiler, Script injection
├── ide.html              # Integrated Development Environment
└── package.json          # Node.js ESM configuration
```

---

## 3. Usage

### Native Khem Script Tags
Run KhemCode directly inside script tags, just like JavaScript. Any HTML returned by the script will be automatically injected into the DOM at the script's location.

```html
<!-- Load the Khem bootstrapper -->
<script type="module" src="./src/index.js"></script>

<!-- Inline Khem script -->
<script type="text/khem">
  div "container" {
    h1 "" { text "Hello from Khem!" }
  }
</script>

<!-- External Khem script -->
<script type="text/khem" src="app.kh"></script>
```

### Inside the Browser (Module)
Khem is designed for the modern web. You can import the compiler directly into your HTML for manual control:

```html
<script type="module">
  import { createEnvironment, run } from './src/index.js';

  const code = `
    document "My App" {
      div "container" {
        h1 "" { text "Hello Khem" }
      }
    }
  `;

  const env = createEnvironment();
  document.body.innerHTML = run(code, env);
</script>
```

### In Node.js
Perfect for generating static dashboards or reports:

```javascript
import { run } from './src/index.js';
import fs from 'fs';

const khemCode = fs.readFileSync('app.kh', 'utf-8');
const htmlOutput = run(khemCode);

fs.writeFileSync('dist/index.html', htmlOutput);
```

---

## 4. Syntax Overview

### Components (Procs)
Procedures allow for reusable UI components with default arguments.

```tcl
proc card { title body type "info" } {
  div "card $type" {
    h2 "" { text $title }
    p "" { text $body }
  }
}

card "System Status" "All nodes operational." "success"
```

### Native CSS (SCSS-Style)
Define your design system directly within Khem. The compiler deduplicates and injects it into the document head.

```tcl
style {
  ".card" {
    background var(--s1)
    border 1px solid var(--border)
    padding 16px
  }
  "h2" { color var(--acc) }
}
```

### Full-Stack Scripting
Khem scripts can be injected to run logic inside the browser.

```tcl
script {
  dom_on "#btn" "click" {
    puts "Interacting with the DOM via Khem logic."
    dom_set "#status" "textContent" "Active"
  }
}
```

---

## 5. UI Guidelines
Khem follows a strict visual identity:
* **Typography**: DM Mono for 95% of the UI; Instrument Serif for branding.
* **Colors**: Primary Accent `#c8a84b` (Gold) over Background `#0a0a0a`.
* **Density**: 12px base font size with 1.6 line-height.

---

## 6. Development
To contribute or modify the engine:
1.  **Clone the repo**: `git clone https://github.com/your-repo/khem-lang.git`
2.  **Run the IDE**: Use a local server (like Live Server or `npx serve`) to open `ide.html`.
3.  **Modular Plugins**: Add new commands in `src/plugins/` to extend the language.
