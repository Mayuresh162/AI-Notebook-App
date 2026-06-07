const ALLOWED_EXPRESSION = /^[\d+\-*/().\s%]+$/;

type Token = number | string;

function tokenize(expression: string) {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/\d|\./.test(char)) {
      let number = char;
      index += 1;

      while (index < expression.length && /[\d.]/.test(expression[index])) {
        number += expression[index];
        index += 1;
      }

      const value = Number(number);

      if (!Number.isFinite(value)) {
        throw new Error("Invalid number");
      }

      tokens.push(value);
      continue;
    }

    if ("+-*/()%".includes(char)) {
      tokens.push(char);
      index += 1;
      continue;
    }

    throw new Error("Unsupported token");
  }

  return tokens;
}

function precedence(operator: string) {
  if (operator === "+" || operator === "-") return 1;
  if (operator === "*" || operator === "/" || operator === "%") return 2;
  return 0;
}

function applyOperator(values: number[], operator: string) {
  const right = values.pop();
  const left = values.pop();

  if (left === undefined || right === undefined) {
    throw new Error("Invalid expression");
  }

  if ((operator === "/" || operator === "%") && right === 0) {
    throw new Error("Division by zero");
  }

  if (operator === "+") values.push(left + right);
  if (operator === "-") values.push(left - right);
  if (operator === "*") values.push(left * right);
  if (operator === "/") values.push(left / right);
  if (operator === "%") values.push(left % right);
}

export function evaluateArithmeticExpression(expression: string) {
  const input = expression.trim();

  if (!input || input.length > 200 || !ALLOWED_EXPRESSION.test(input)) {
    throw new Error("Unsupported expression");
  }

  const values: number[] = [];
  const operators: string[] = [];
  const tokens = tokenize(input);

  for (const token of tokens) {
    if (typeof token === "number") {
      values.push(token);
      continue;
    }

    if (token === "(") {
      operators.push(token);
      continue;
    }

    if (token === ")") {
      while (operators.length && operators[operators.length - 1] !== "(") {
        applyOperator(values, operators.pop() || "");
      }

      if (operators.pop() !== "(") {
        throw new Error("Invalid expression");
      }

      continue;
    }

    while (
      operators.length &&
      precedence(operators[operators.length - 1]) >= precedence(token)
    ) {
      applyOperator(values, operators.pop() || "");
    }

    operators.push(token);
  }

  while (operators.length) {
    const operator = operators.pop() || "";

    if (operator === "(") {
      throw new Error("Invalid expression");
    }

    applyOperator(values, operator);
  }

  if (values.length !== 1 || !Number.isFinite(values[0])) {
    throw new Error("Invalid expression");
  }

  return values[0];
}
