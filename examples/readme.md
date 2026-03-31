# Khem Examples

Runnable examples covering the language surface. Each file is self-contained — no imports required.

## Run any example

```bash
node bin/khem.js serve examples/<name>.kh
# then open http://localhost:4173
```

Or compile to static HTML:

```bash
node bin/khem.js build examples/<name>.kh > output.html
```

## Index

### 🎛 Interactive UI

#### `hello.kh`
The simplest possible example — a heading and paragraph with styling.

#### `counter.kh`
A reactive counter with increment, decrement, and reset.

Demonstrates: `state`, `on_click`, `set expr`, reactive re-render.

#### `calculator.kh`
A four-operation calculator with a button grid.

Demonstrates: `state`, `on_click`, `set expr`, conditional display.

#### `todo.kh`
A task list with add button and static items.

Demonstrates: `state`, `on_click`, input fields, styled components.

#### `fizzbuzz.kh`
Classic FizzBuzz with prev/next navigation.

Demonstrates: `state`, `on_click`, `set expr`, CSS grid.

### 📊 Data & Layout

#### `log-viewer.kh`
A static event log with level-coded entries and filter chips.

Demonstrates: CSS grid, semantic color classes, dark-theme styling.

#### `invoice.kh`
A static invoice layout with parties, line items, and totals.

Demonstrates: `set` variables, CSS grid, typography hierarchy.

### 👤 Profile & Cards

#### `profile.kh`
A minimal profile card with name, role, and year.

Demonstrates: `set` variables, `text "$var"` substitution.

#### `profile-card.kh`
A styled profile card with avatar, bio, and metadata.

Demonstrates: `set` variables, `style {}` block, CSS variables.

### 📖 Language Reference

#### `stdlib-tour.kh`
A cheat-sheet for stdlib commands — math, strings, control flow, procedures.

Demonstrates: `set`, `text [fn args]`, `proc`, `match`, math/string/comparison functions.

#### `test_match.kh`
Pattern matching test with different cases.

Demonstrates: `proc`, `match`, default case.
