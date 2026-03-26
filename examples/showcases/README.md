# Khem Showcases

These examples are designed as executable documentation.

## 1) Dashboard showcase

```bash
khem serve examples/showcases/dashboard.kh 4173
```

Open: http://localhost:4173

What it demonstrates:
- reactive `state`
- `derive` recomputation
- event `action` blocks
- incremental rerendering

## 2) Components showcase

```bash
khem serve examples/showcases/components.kh 4174
```

Open: http://localhost:4174

What it demonstrates:
- baseline UI primitives:
  - `modal`
  - `tabs`
  - `toast`
  - `table`
  - `form`
  - `datepicker`

## Build static HTML

```bash
khem build examples/showcases/dashboard.kh > /tmp/dashboard.html
khem build examples/showcases/components.kh > /tmp/components.html
```
