# Editor Support (4.5)

Khem now includes baseline editor assets:

- **TextMate grammar**: `syntaxes/khem.tmLanguage.json`
- **Static completion list**: `tooling/khem-completions.json`

## Use in VS Code

1. Create an extension scaffold (`yo code`) or use an existing extension.
2. Copy `syntaxes/khem.tmLanguage.json` into your extension's `syntaxes/` folder.
3. Add grammar contribution in `package.json`:

```json
{
  "contributes": {
    "languages": [{ "id": "khem", "extensions": [".kh"], "aliases": ["Khem"] }],
    "grammars": [{ "language": "khem", "scopeName": "source.khem", "path": "./syntaxes/khem.tmLanguage.json" }]
  }
}
```

4. Load `tooling/khem-completions.json` in your completion provider.

## Use in Zed / other editors

- Any editor that supports TextMate grammars can consume `syntaxes/khem.tmLanguage.json`.
- The command list in `tooling/khem-completions.json` can be used to seed custom completion plugins.
