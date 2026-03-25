import {
  astToLegacy,
  createBlockNode,
  createCommandCallNode,
  createLiteralNode,
  createListNode,
  createSymbolNode,
} from "./ast.js";

export class ParseError extends Error {
  constructor(code, message, line, column) {
    super(message);
    this.name = "ParseError";
    this.code = code;
    this.line = line;
    this.column = column;
  }
}

const createLoc = (line, column) => ({ line, column });

const tokenize = (code) => {
  const tokens = [];
  let i = 0;
  let line = 1;
  let column = 1;

  const advance = () => {
    const ch = code[i++];
    if (ch === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
    return ch;
  };

  while (i < code.length) {
    const ch = code[i];

    if (ch === " " || ch === "\t" || ch === "\r") {
      advance();
      continue;
    }

    if (ch === "\n") {
      tokens.push({ type: "NEWLINE", value: "\n", line, column });
      advance();
      continue;
    }

    if (ch === "#") {
      while (i < code.length && code[i] !== "\n") advance();
      continue;
    }

    if (ch === "{") {
      tokens.push({ type: "LBRACE", value: ch, line, column });
      advance();
      continue;
    }

    if (ch === "}") {
      tokens.push({ type: "RBRACE", value: ch, line, column });
      advance();
      continue;
    }

    if (ch === ";") {
      tokens.push({ type: "SEMICOLON", value: ch, line, column });
      advance();
      continue;
    }

    if (ch === '"') {
      const startLine = line;
      const startColumn = column;
      advance(); // opening quote

      let value = "";
      let terminated = false;

      while (i < code.length) {
        const c = code[i];
        if (c === '"') {
          advance();
          terminated = true;
          break;
        }
        if (c === "\\") {
          const slashLine = line;
          const slashColumn = column;
          advance();
          if (i >= code.length) {
            throw new ParseError(
              "E_UNTERMINATED_STRING",
              "Unterminated quoted string.",
              slashLine,
              slashColumn,
            );
          }
          const escaped = advance();
          value += escaped;
          continue;
        }
        value += advance();
      }

      if (!terminated) {
        throw new ParseError(
          "E_UNTERMINATED_STRING",
          "Unterminated quoted string.",
          startLine,
          startColumn,
        );
      }

      tokens.push({
        type: "STRING",
        value,
        line: startLine,
        column: startColumn,
      });
      continue;
    }

    const startLine = line;
    const startColumn = column;
    let value = "";

    while (i < code.length) {
      const c = code[i];
      if (
        c === " " ||
        c === "\t" ||
        c === "\r" ||
        c === "\n" ||
        c === "{" ||
        c === "}" ||
        c === ";" ||
        c === '"' ||
        c === "#"
      ) {
        break;
      }
      value += advance();
    }

    tokens.push({
      type: "SYMBOL",
      value,
      line: startLine,
      column: startColumn,
    });
  }

  tokens.push({ type: "EOF", value: "", line, column });
  return tokens;
};

export function parseAst(code) {
  const tokens = tokenize(code);
  let cursor = 0;

  const peek = () => tokens[cursor];
  const consume = () => tokens[cursor++];

  const parseBlock = (isRoot = false, startToken = null) => {
    const body = [];
    const blockLoc = startToken
      ? createLoc(startToken.line, startToken.column)
      : createLoc(1, 1);
    let current = [];

    const flushStatement = (token) => {
      if (!current.length) return;

      const head = current[0];
      if (!head || head.type !== "Symbol") {
        if (isRoot) {
          throw new ParseError(
            "E_INVALID_SEQUENCE",
            "Invalid command sequence: statements must start with a command symbol.",
            head?.loc?.line ?? token.line,
            head?.loc?.column ?? token.column,
          );
        }

        body.push(
          createListNode(
            current,
            createLoc(
              head?.loc?.line ?? token.line,
              head?.loc?.column ?? token.column,
            ),
          ),
        );
        current = [];
        return;
      }

      body.push(
        createCommandCallNode(
          head.name,
          current.slice(1),
          createLoc(head.loc.line, head.loc.column),
        ),
      );
      current = [];
    };

    while (cursor < tokens.length) {
      const token = peek();

      if (token.type === "EOF") {
        flushStatement(token);
        if (!isRoot) {
          throw new ParseError(
            "E_UNMATCHED_OPEN_BRACE",
            "Unmatched '{' - block was not closed.",
            blockLoc.line,
            blockLoc.column,
          );
        }
        return createBlockNode(body, blockLoc);
      }

      if (token.type === "SEMICOLON" || token.type === "NEWLINE") {
        consume();
        flushStatement(token);
        continue;
      }

      if (token.type === "RBRACE") {
        consume();
        flushStatement(token);
        if (isRoot) {
          throw new ParseError(
            "E_UNMATCHED_CLOSE_BRACE",
            "Unmatched '}' encountered.",
            token.line,
            token.column,
          );
        }
        return createBlockNode(body, blockLoc);
      }

      if (token.type === "LBRACE") {
        if (!current.length && isRoot) {
          throw new ParseError(
            "E_INVALID_SEQUENCE",
            "Invalid top-level token sequence: block cannot start a statement.",
            token.line,
            token.column,
          );
        }
        const open = consume();
        current.push(parseBlock(false, open));
        continue;
      }

      consume();
      if (token.type === "STRING") {
        current.push(
          createLiteralNode(token.value, createLoc(token.line, token.column)),
        );
      } else if (token.type === "SYMBOL") {
        current.push(
          createSymbolNode(token.value, createLoc(token.line, token.column)),
        );
      } else {
        throw new ParseError(
          "E_INVALID_SEQUENCE",
          `Invalid token '${token.value}' in command sequence.`,
          token.line,
          token.column,
        );
      }
    }

    return createBlockNode(body, blockLoc);
  };

  return parseBlock(true, null);
}

export function parse(code) {
  const ast = parseAst(code);
  return astToLegacy(ast);
}
