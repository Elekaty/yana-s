import type { ScanResult } from "@/lib/scan/schema";

export function applyMath(result: ScanResult): { result: ScanResult; flagged: boolean } {
  let flagged = false;
  const tasks = result.child_ui.tasks.map((task) => {
    const computed = [
      ...extractExpressions(task.instruction_fr),
      ...extractExpressions(task.instruction_en),
    ]
      .map(computeExpression)
      .filter((value): value is number => value !== null);
    if (computed.length === 0) return task;
    const geminiNumber = parseLooseNumber(task.expected_answer);
    if (geminiNumber !== null && computed.some((value) => nearlyEqual(value, geminiNumber))) return task;
    flagged = true;
    return { ...task, expected_answer: formatNumber(computed[computed.length - 1]!) };
  });

  const dashboard = { ...result.parent_dashboard };
  if (flagged) {
    dashboard.confidence = Math.min(dashboard.confidence, 0.5);
    const note = "The maths answer was checked in the app.";
    dashboard.unclear_note = dashboard.unclear_note ? `${dashboard.unclear_note} ${note}` : note;
  }

  return {
    flagged,
    result: {
      ...result,
      parent_dashboard: dashboard,
      child_ui: { ...result.child_ui, tasks },
    },
  };
}

export function extractExpressions(text: string) {
  const wrapped =
    text.match(
      /\(\s*\d+(?:[.,]\d+)?(?:\s*[+\-×÷x*/]\s*\d+(?:[.,]\d+)?)*\s*\)(?:\s*[+\-×÷x*/]\s*\d+(?:[.,]\d+)?)*/gi,
    ) ?? [];
  const plain =
    text.match(/\d+(?:[.,]\d+)?(?:\s*[+\-×÷x*/]\s*\d+(?:[.,]\d+)?)+/gi) ?? [];
  return [...wrapped, ...plain];
}

export function computeExpression(input: string) {
  const tokens = tokenize(input);
  if (!tokens) return null;
  const pos = { i: 0 };
  const value = parseExpression(tokens, pos);
  if (value === null || pos.i !== tokens.length) return null;
  return value;
}

function tokenize(input: string) {
  const source = input.replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/x/gi, "*");
  const tokens: string[] = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index]!;
    if ("()+*-/".includes(char)) {
      tokens.push(char);
      index += 1;
      continue;
    }
    const match = /^(\d+(?:\.\d+)?)/.exec(source.slice(index).replace(",", "."));
    if (!match) return null;
    tokens.push(match[1]);
    index += match[1].includes(".") ? match[1].length : match[1].length;
    if (source[index] === ",") index += 1;
  }
  return tokens;
}

function parseExpression(tokens: string[], pos: { i: number }): number | null {
  let left = parseTerm(tokens, pos);
  if (left === null) return null;
  while (tokens[pos.i] === "+" || tokens[pos.i] === "-") {
    const operator = tokens[pos.i];
    pos.i += 1;
    const right = parseTerm(tokens, pos);
    if (right === null) return null;
    left = operator === "+" ? left + right : left - right;
  }
  return left;
}

function parseTerm(tokens: string[], pos: { i: number }): number | null {
  let left = parseFactor(tokens, pos);
  if (left === null) return null;
  while (tokens[pos.i] === "*" || tokens[pos.i] === "/") {
    const operator = tokens[pos.i];
    pos.i += 1;
    const right = parseFactor(tokens, pos);
    if (right === null || (operator === "/" && right === 0)) return null;
    left = operator === "*" ? left * right : left / right;
  }
  return left;
}

function parseFactor(tokens: string[], pos: { i: number }): number | null {
  if (tokens[pos.i] === "-") {
    pos.i += 1;
    const value = parseFactor(tokens, pos);
    return value === null ? null : -value;
  }
  if (tokens[pos.i] === "(") {
    pos.i += 1;
    const value = parseExpression(tokens, pos);
    if (value === null || tokens[pos.i] !== ")") return null;
    pos.i += 1;
    return value;
  }
  const token = tokens[pos.i];
  if (!token || Number.isNaN(Number(token))) return null;
  pos.i += 1;
  return Number(token);
}

function parseLooseNumber(value: string) {
  const match = value.trim().replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  return Number(match[0]);
}

function nearlyEqual(left: number, right: number) {
  return Math.abs(left - right) < 0.001;
}

function formatNumber(value: number) {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 1000) / 1000);
}
