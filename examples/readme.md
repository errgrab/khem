# Khem Examples

Runnable examples covering the full language surface. Each file is self-contained — no imports required.

---

## Run any example

```bash
khem serve examples/<name>.kh
# then open http://localhost:4173
```

Or compile to static HTML:

```bash
khem build examples/<name>.kh > /tmp/<name>.html
```

---

## Index

### 🎛 Interactive UI

#### `counter.kh`
A minimal reactive counter with configurable step size.

Demonstrates: `state`, `derive`, `match`, reactive `action` blocks, class-based button variants.

```bash
khem serve examples/counter.kh
```

---

#### `todo.kh`
A filterable task list — add, complete, and filter tasks by status.

Demonstrates: `state` (list), `push`, `filter`, `foreach`, `derive`, `length`, DOM input via `js`, `dom_on`.

```bash
khem serve examples/todo.kh
```

---

#### `calculator.kh`
A four-operation calculator with a full button grid.

Demonstrates: `proc`, `match`, `expr`, `join`, multi-state composition, class variants per key type.

```bash
khem serve examples/calculator.kh
```

---

### 📊 Data & Dashboards

#### `log-viewer.kh`
A filterable log feed — level filter chips, per-row colour coding, live entry count.

Demonstrates: `foreach`, `match`, `filter`, `split`, `find`, `starts-with`, `derive`, list literals, `style` inline colour binding.

```bash
khem serve examples/log-viewer.kh
```

---

### 🛠 Real-World Mini-Apps

#### `invoice.kh`
A static invoice layout with auto-computed subtotal, VAT, and total.

Demonstrates: `proc` (reusable row component), `foreach`, `derive`, `split`, `find`, `expr`, `today`, multi-column CSS grid layout.

```bash
khem serve examples/invoice.kh
```

---

#### `profile-card.kh`
A live-preview profile editor — edit fields on the left, card updates on the right. State is persisted to localStorage.

Demonstrates: `state` + `persist`, `derive` (computed initials and slug), `dom_on`, `js`, `replace`, `lower`, `split`, reactive re-render, `style` inline accent colour.

```bash
khem serve examples/profile-card.kh
```

---

### 📖 Language Reference

#### `stdlib-tour.kh`
A runnable cheat-sheet for every stdlib primitive — each command is shown with its live output.

Demonstrates: all math, string, list, date, control-flow, pattern-matching, proc, try/catch, and derive commands in one document.

```bash
khem serve examples/stdlib-tour.kh
```

---

## What each example covers

| Example          | `state` | `derive` | `proc` | `foreach` | `match` | `persist` | DOM events |
|------------------|:-------:|:--------:|:------:|:---------:|:-------:|:---------:|:----------:|
| counter          | ✓       | ✓        |        |           | ✓       |           |            |
| todo             | ✓       | ✓        |        | ✓         |         |           | ✓          |
| calculator       | ✓       |          | ✓      |           | ✓       |           |            |
| log-viewer       | ✓       | ✓        |        | ✓         | ✓       |           |            |
| invoice          |         | ✓        | ✓      | ✓         |         |           |            |
| profile-card     | ✓       | ✓        | ✓      |           |         | ✓         | ✓          |
| stdlib-tour      | ✓       | ✓        | ✓      | ✓         | ✓       |           |            |
