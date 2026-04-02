# Contributing to Khem

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/khem.git`
3. Install dependencies: `npm install`

## Development

### Running Tests

```bash
npm test
```

### Running a specific test suite

```bash
node tests/parser_test.js
node tests/stdlib_test.js
node tests/web_test.js
```

### Filtering tests

Use `--grep <pattern>` to run only tests matching the pattern:

```bash
node tests/stdlib_test.js --grep "if:"
```

### Building

```bash
npm run build
```

### Running the REPL

```bash
npm run repl
```

## Code Style

- Use 2 spaces for indentation
- No semicolons
- No linting tools (follow existing patterns)
- Use ES modules (`"type": "module"` in package.json)

## Project Structure

```
src/
  khem.js      - Core: Parser, VM, StdLib, Scope, Reactivity
  compiler.js  - AST → JS compiler for DOM rendering
  shared.js    - Constants and helpers
  plugins/web.js - Web-specific commands
  styles.js    - Default CSS
index.js       - Public API

tests/
  parser_test.js
  stdlib_test.js
  web_test.js
```

## Adding New Commands

1. Add to `Khem.StdLib.register(vm)` in `src/khem.js`
2. Command receives `(args, vm)` and returns string or `null`
3. Use `vm.scope.get(name)` to read variables, `vm.scope.set(name, value)` to write
4. For special return values, return `{ __khemReturn: true, value: "..." }`

## Submitting Changes

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Build: `npm run build`
5. Push and create a pull request