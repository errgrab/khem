// src/shared.js — constantes e helpers usados por compiler.js e web.js
// Note: parseCSS now handles string input directly, no need to import Khem.Parser

// HTML void elements (não têm tag de fechamento)
export const VOID_ELEMENTS = new Set([
  "br", "hr", "img", "input", "meta", "link",
  "area", "base", "col", "embed", "source", "track", "wbr",
]);

// Block tags — shorthand em khem (div { ... } em vez de elem "div" { ... })
export const BLOCK_TAGS = new Set([
  "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "table", "tr", "td", "th",
  "section", "main", "header", "footer", "nav", "article",
  "form", "pre", "code", "blockquote", "strong", "em", "button", "input", "a",
]);

// Regex para detectar $variáveis
export const VAR_PATTERN = /\$([a-zA-Z_][a-zA-Z0-9_-]*)/g;

// Palavras reservadas JS (evitar conflitos em nomes de variáveis)
export const JS_RESERVED = new Set([
  "break", "case", "catch", "continue", "debugger", "default", "delete",
  "do", "else", "finally", "for", "function", "if", "in", "instanceof",
  "new", "return", "switch", "throw", "try", "typeof", "var", "void",
  "while", "with", "class", "const", "enum", "export", "extends",
  "import", "super", "implements", "interface", "let", "package",
  "private", "protected", "public", "static", "yield", "await", "async",
]);

// Sanitiza nome para não colidir com reserved words
export function sanitizeId(name) {
  return JS_RESERVED.has(name) ? "_" + name : name;
}

// Envolve string como literal JS seguro
export function jsStr(s) {
  return JSON.stringify(String(s));
}

// ─── CSS parser (khem syntax → CSS) ─────────────────────────────────────────
// Converte CSS em syntax khem (sem : ou ;) para CSS válido.
// Ex: ".app { display flex; color red }" → ".app {\n  display: flex;\n  color: red;\n}"
// O parâmetro `evalFn` é opcional — se fornecido, avalia arrays como expressões.
export function parseCSS(src, evalFn) {
  const ev = (t) => {
    if (Array.isArray(t)) return evalFn ? evalFn(t) : t.join(" ");
    return String(t);
  };
  
  function format(cmds, indent = "") {
    // Parse CSS input - handle both array and string
    let parsed;
    if (typeof cmds === "string") {
      // Handle string input like ".app { padding 24px }"
      // Split by "{" to separate selector from body
      const braceIdx = cmds.indexOf("{");
      if (braceIdx === -1) {
        return ""; // No brace, invalid CSS
      }
      
      let selector = cmds.slice(0, braceIdx).trim();
      // Remove surrounding quotes from selector if present
      if ((selector.startsWith('"') && selector.endsWith('"')) ||
          (selector.startsWith("'") && selector.endsWith("'"))) {
        selector = selector.slice(1, -1);
      }
      
      const body = cmds.slice(braceIdx + 1).replace(/}$/, "").trim();
      
      if (!body) {
        return `${indent}${selector} {}`;
      }
      
      // Split body by ";" to get properties
      const props = body.split(";").map(s => s.trim()).filter(Boolean);
      const cssProps = props.map(prop => {
        const idx = prop.indexOf(" ");
        if (idx === -1) return `${prop};`;
        return `${prop.slice(0, idx).trim()}: ${prop.slice(idx + 1).trim()};`;
      }).join("\n" + indent);
      
      return `${indent}${selector} {\n${indent}${cssProps}\n${indent}}`;
    } else if (Array.isArray(cmds)) {
      parsed = cmds;
    } else {
      parsed = [cmds];
    }
    
    return parsed.map(cmd => {
      if (typeof cmd === "string") {
        // Block selector with nested content
        if (cmd.includes("{")) {
          const parts = cmd.split("{");
          let selector = parts[0].trim();
          // Remove surrounding quotes from selector if present
          if ((selector.startsWith('"') && selector.endsWith('"')) ||
              (selector.startsWith("'") && selector.endsWith("'"))) {
            selector = selector.slice(1, -1);
          }
          const body = parts.slice(1).join("{").replace(/}$/, "").trim();
          return `${indent}${selector} {\n${format(body, indent + "  ")}${indent}}`;
        }
        // Simple property (no colon but has space - treat as property)
        if (cmd.includes(" ") && !cmd.includes(":")) {
          const idx = cmd.indexOf(" ");
          return `${indent}${cmd.slice(0, idx).trim()}: ${cmd.slice(idx + 1).trim()};`;
        }
        // Property with colon
        const colonIdx = cmd.indexOf(":");
        if (colonIdx !== -1) {
          return `${indent}${cmd.slice(0, colonIdx).trim()}: ${cmd.slice(colonIdx + 1).trim()};`;
        }
        return `${indent}${cmd}`;
      }
      
      // Array command: [selector, body] - like [".app", "padding 24px"]
      if (cmd.length >= 2) {
        let selector = ev(cmd[0]);
        // Remove surrounding quotes from selector if present
        if ((selector.startsWith('"') && selector.endsWith('"')) ||
            (selector.startsWith("'") && selector.endsWith("'"))) {
          selector = selector.slice(1, -1);
        }
        const body = cmd.slice(1).join(" ");
        // Check if body ends with ; or \n (indicating nested block in original syntax)
        const last = cmd[cmd.length - 1];
        if (typeof last === "string" && /[;\n]/.test(last)) {
          const selectorPart = cmd.slice(0, -1).map(ev).join(" ");
          return `${indent}${selectorPart} {\n${format(last, indent + "  ")}${indent}}`;
        }
        // Body is properties - convert space-separated to CSS
        const props = body.split(";").map(s => s.trim()).filter(Boolean);
        if (props.length === 0) {
          return `${indent}${selector} {}`;
        }
        const cssProps = props.map(prop => {
          const idx = prop.indexOf(" ");
          if (idx === -1) return `${prop};`;
          return `${prop.slice(0, idx).trim()}: ${prop.slice(idx + 1).trim()};`;
        }).join("\n" + indent);
        return `${indent}${selector} {\n${indent}${cssProps}\n${indent}}`;
      }
      
      // Simple array command
      const last = cmd[cmd.length - 1];
      // Se o último token tem ; ou \n, é um bloco aninhado (selector { ... })
      if (typeof last === "string" && /[;\n]/.test(last)) {
        const selector = cmd.slice(0, -1).map(ev).join(" ");
        return `${indent}${selector} {\n${format(last, indent + "  ")}${indent}}`;
      }
      // Propriedade normal: prop: val;
      return `${indent}${ev(cmd[0])}: ${cmd.slice(1).map(ev).join(" ")};`;
    }).join("\n") + "\n";
  }
  return format(src);
}
