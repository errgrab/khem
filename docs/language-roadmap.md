# Khem Language Roadmap (Active)

> Goal: Make Khem the go-to language for every new project — structure, logic, state, and UI.

## Completed Foundation (cut from active queue)

The following roadmap items are implemented and no longer tracked as active backlog:

- Typed runtime value handling (including lists/maps/null-compatible runtime flow)
- Native expression evaluator (`expr`) wired into conditional logic
- Proc return values with `return` propagation
- Literal constructors for list/map and primitive type helpers
- First-class error control (`throw`, `try`, `catch`)

---

## Phase 2 — Reactive State *(completed baseline)*

### 2.1 Reactive state store `stdlib` `browser`

- ✅ Basic state keys via `state key value`
- ✅ `set` triggers runtime state-change notifications for tracked keys
- ✅ Dependency-aware subscriptions for derive/render invalidation

### 2.2 Event binding command `web`

- ✅ `on` command added as a Khem-native alias for DOM event binding blocks
- ✅ Event payload context (`event_type`, `event_target_id`, `event_target_value`)

### 2.3 Component re-render system `engine` `browser`

- ✅ Naive full rerender loop wired to state changes in browser boot runtime
- ✅ State-key based component invalidation (no full rerender on unrelated updates)

### 2.4 Computed values `stdlib`

- ✅ `derive name { ... }` command added with recompute on state change
- ✅ Derivation dependency tracking and selective recomputation

### 2.5 localStorage binding `stdlib`

- ✅ `persist key` and state hydration hooks
- ✅ Versioned persistence envelopes (`{ v, data }`) and migration hook support

---

## Phase 3 — Standard Library *(completed baseline)*

### 3.1 String operations `stdlib`

- ✅ Implemented: `split`, `join`, `trim`, `upper`, `lower`, `slice`, `replace`, `contains`, `starts-with`, `ends-with`

### 3.2 List operations `stdlib`

- ✅ Implemented: `map`, `filter`, `reduce`, `find`, `sort`, `length`, `push`, `pop`, `slice`, `contains`

### 3.3 Date and time `stdlib`

- ✅ Implemented: `today`, `year-of`, `month-of`, `day-of`, `days-in-month`, `format-date`

### 3.4 Math module `stdlib`

- ✅ Implemented: `min`, `max`, `abs`, `floor`, `ceil`, `round`, `mod`, `clamp`, `pow`

### 3.5 Pattern matching `stdlib`

- ✅ `match` command with `default` fallback branch

---

## Phase 4 — Tooling *(parallel work)*

### 4.1 Source maps and line errors `dx`
- ✅ CLI surfaces parser errors with file, line, and column.
- ✅ Import/runtime parse errors now include module file + line + column context.

### 4.2 Watch mode build `dx`
- ✅ `khem watch app.kh` rebuild loop added (writes sibling `.html`).
- ✅ `khem serve` includes SSE-based live reload channel.

### 4.3 REPL `dx`
- ✅ `khem repl` interactive shell added.

### 4.4 Khem test runner `dx`
- ✅ `khem test` command added (runs node + parser suites).

### 4.5 LSP and syntax grammar `dx`
- ✅ TextMate grammar (`syntaxes/khem.tmLanguage.json`) added.
- ✅ Static completions (`tooling/khem-completions.json`) added.

---

## Phase 5 — Ecosystem *(milestone path)*

### 5.1 Module and import system `engine`
- ✅ Runtime `import` command resolves and executes module source in shared env.
- ✅ CLI preloads module graph for build/watch/serve and resolves relative imports.

### 5.2 Khem component library `stdlib` `web`
- ✅ Baseline UI library shipped: `modal`, `datepicker`, `tabs`, `toast`, `table`, `form`.

### 5.3 Native canvas and SVG drawing `web`
- Declarative draw DSL compiled to SVG/Canvas2D.

### 5.4 Node.js server mode `engine`
- ✅ `khem serve app.kh [port]` command added for runtime HTTP rendering.

### 5.5 First non-trivial app `milestone`
- Full Escala rewrite in Khem, no JS fallback.
