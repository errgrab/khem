/**
 * Khem AST node model.
 *
 * - SymbolNode: command names and bare identifiers.
 * - LiteralNode: quoted string literal values.
 * - BlockNode: nested list of command calls.
 * - CommandCallNode: one command invocation with argument nodes.
 * - ListNode: anonymous list payload (used for legacy block/list syntax compatibility).
 *
 * Future extension point:
 * - ExpressionNode: reserved for richer typed expressions.
 */

export const createSymbolNode = (name, loc) => ({ type: "Symbol", name, loc });

export const createLiteralNode = (value, loc) => ({
  type: "Literal",
  value,
  loc,
});

export const createBlockNode = (body, loc) => ({ type: "Block", body, loc });

export const createCommandCallNode = (name, args, loc) => ({
  type: "CommandCall",
  name,
  args,
  loc,
});

export const createListNode = (items, loc) => ({ type: "List", items, loc });

/**
 * Converts AST nodes into the historical array-based AST format used by runtime commands.
 */
export const astToLegacy = (node) => {
  if (!node) return [];

  if (node.type === "Block") {
    return node.body.map((stmt) => astToLegacy(stmt));
  }

  const mapValue = (arg) => {
    if (arg.type === "Block") return astToLegacy(arg);
    if (arg.type === "Literal") return arg.value;
    if (arg.type === "Symbol") return arg.name;
    if (arg.type === "List") return arg.items.map((item) => mapValue(item));
    return "";
  };

  if (node.type === "CommandCall") {
    return [node.name, ...node.args.map((arg) => mapValue(arg))];
  }

  if (node.type === "List") {
    return node.items.map((item) => mapValue(item));
  }

  return [];
};
