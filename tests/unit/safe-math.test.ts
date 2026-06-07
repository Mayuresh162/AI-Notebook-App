import { evaluateArithmeticExpression } from "@/lib/safe-math";

describe("evaluateArithmeticExpression", () => {
  it("evaluates arithmetic without JavaScript execution", () => {
    expect(evaluateArithmeticExpression("2 + 3 * 4")).toBe(14);
  });

  it("rejects unsupported input", () => {
    expect(() => evaluateArithmeticExpression("process.exit()")).toThrow(
      "Unsupported expression",
    );
  });
});
