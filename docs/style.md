# Khem Design System & UI Guidelines

This document defines the visual identity, typography, color system, and UI components for Khem.

## 1) Core Philosophy

- **Dark-first:** no light mode, built around deep blacks/grays.
- **Typographic hierarchy:** structure through spacing, font choice, and color.
- **Information density:** tight layout with clarity via contrast and borders.

## 2) Typography

### Font stack

- **Primary (Monospace):** `DM Mono`, `'Fira Mono'`, `ui-monospace`, `monospace`
  - Weights: `300`, `400`, `500`
  - Usage: body, labels, buttons, code
- **Accent (Serif):** `Instrument Serif`, `Georgia`, `serif`
  - Weights: `400`, `400 italic`
  - Usage: logo and top-level headers

### Type scale

- Base text: `12px – 12.5px`
- Line-height: `1.6 – 1.65`
- Micro text: `9.5px – 10px`, uppercase, `letter-spacing: 0.04em – 0.18em`
- `<code>`: `10px – 10.5px`, monospace, color `var(--acc)`

## 3) Color System (CSS Variables)

### Backgrounds & surfaces

```css
--bg: #0a0a0a;   /* app/site background */
--s0: #101010;   /* lowest surface (lists) */
--s1: #161616;   /* inputs, raised areas */
--s2: #1e1e1e;   /* panels, popups */
--s3: #262626;   /* elevated hover */
```

### Borders

```css
--border: #272727; /* default */
--b2: #333333;     /* hover/stronger */
```

### Foreground text

```css
--fg: #d4d0c8;
--fg1: #aaaaaa;
--fg2: #888888;
--fg3: #555555;
--dim: #484848;
```

### Semantic accents

```css
--acc: #c8a84b;
--acc-dim: #7a6628;

--green: #6b9e78;
--green-dim: #2a4a33;

--red: #a86b6b;
--red-dim: #4a2222;

--blue: #7a8fa8;
--blue-dim: #2a3a4a;

--amber: #d4924a;
```

## 4) UI Components

### Badges & tags

- Text size: `~9.5px`
- Padding: `1px 6px` or `2px 8px`
- Border: `1px solid`
- Use semantic foreground + dark background

### Status indicators

- Dot size: `6px – 8px`
- `todo`: `--border` / `--b2`
- `active`: `--acc` (+ subtle glow)
- `done`: `--green`
- `blocked`: `--red`

### Inputs & textareas

- Square corners, transparent or `--s1` background
- `border: 1px solid var(--border)`
- Focus: no outline; border shifts to `--acc` or `--dim`
- Padding: `8px 10px`
- Transition: `0.15s`

### Buttons

- Default: transparent, `--border`, `--fg2`
- Hover: border `--b2`, text `--fg`
- Primary: border/text `--acc` (or `--acc-dim`), hover `--acc`
- Danger: hover `--red`

## 5) Layout Rules

- Scrollbars: track `--bg`, thumb `--border`, hover `--b2`, width `4px – 8px`
- Depth: no shadows (except optional active-dot glow)
- Elevation should come from layer color + borders
- Rendering: `-webkit-font-smoothing: antialiased`

## 6) CSS Reset Boilerplate

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  height: 100%;
}

body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
```
