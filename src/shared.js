// src/shared.js — constantes e helpers usados por compiler.js e web.js

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
