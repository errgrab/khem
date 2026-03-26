const PRECEDENCE = {
  "||": 1,
  "&&": 2,
  "==": 3,
  "!=": 3,
  "===": 3,
  "!==": 3,
  ">": 4,
  ">=": 4,
  "<": 4,
  "<=": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  "%": 6,
};

const isOperator = (token) => Object.hasOwn(PRECEDENCE, token);

const applyOperator = (op, left, right) => {
  switch (op) {
    case "+":
      return Number(left) + Number(right);
    case "-":
      return Number(left) - Number(right);
    case "*":
      return Number(left) * Number(right);
    case "/":
      return Number(left) / Number(right);
    case "%":
      return Number(left) % Number(right);
    case ">":
      return Number(left) > Number(right);
    case ">=":
      return Number(left) >= Number(right);
    case "<":
      return Number(left) < Number(right);
    case "<=":
      return Number(left) <= Number(right);
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case "===":
      return left === right;
    case "!==":
      return left !== right;
    case "&&":
      return Boolean(left) && Boolean(right);
    case "||":
      return Boolean(left) || Boolean(right);
    default:
      throw new Error(`Unsupported operator: ${op}`);
  }
};

const tokenizeExpression = (raw) =>
  raw
    .replace(/(===|!==|>=|<=|==|!=|\|\||&&|\+|-|\*|\/|%|>|<)/g, " $1 ")
    .replace(/([()])/g, " $1 ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const coerceTokenValue = (token) => {
  if (token === "true") return true;
  if (token === "false") return false;
  if (token === "null") return null;
  if (/^-?\d+$/.test(token)) return Number.parseInt(token, 10);
  if (/^-?\d+\.\d+$/.test(token)) return Number.parseFloat(token);
  return token;
};

export const evaluateExpression = (expression) => {
  const tokens = Array.isArray(expression)
    ? expression.map((token) => String(token))
    : tokenizeExpression(String(expression ?? ""));

  const values = [];
  const operators = [];

  const collapse = () => {
    const op = operators.pop();
    const right = values.pop();
    const left = values.pop();
    if (left === undefined || right === undefined) {
      throw new Error("Invalid expression");
    }
    values.push(applyOperator(op, left, right));
  };

  for (const token of tokens) {
    if (token === "(") {
      operators.push(token);
      continue;
    }

    if (token === ")") {
      while (operators.length && operators[operators.length - 1] !== "(") collapse();
      if (operators[operators.length - 1] !== "(") {
        throw new Error("Unmatched ')' in expression");
      }
      operators.pop();
      continue;
    }

    if (isOperator(token)) {
      while (
        operators.length &&
        operators[operators.length - 1] !== "(" &&
        PRECEDENCE[operators[operators.length - 1]] >= PRECEDENCE[token]
      ) {
        collapse();
      }
      operators.push(token);
      continue;
    }

    values.push(coerceTokenValue(token));
  }

  while (operators.length) {
    if (operators[operators.length - 1] === "(") {
      throw new Error("Unmatched '(' in expression");
    }
    collapse();
  }

  if (values.length !== 1) {
    throw new Error("Invalid expression");
  }

  return values[0];
};
