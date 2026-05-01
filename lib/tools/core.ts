import { DynamicTool } from "@langchain/core/tools";

export const calculatorTool = new DynamicTool({
  name: "calculator",
  description: "Solve math expressions",
  func: async (input: string) => {
    try {
      return String(eval(input));
    } catch {
      return "Invalid expression";
    }
  },
});

export const currentDateTool = new DynamicTool({
  name: "date",
  description: "Get current date/time",
  func: async () => new Date().toString(),
});