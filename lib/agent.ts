import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { llm } from "./langchain";
import {
  calculatorTool,
  currentDateTool,
  webTool,
  webSearchTool,
  getLocalSearchTool,
  getNotionTool,
  getDriveTool,
} from "./tools";

export async function getAgent(userId: string) {
  return await initializeAgentExecutorWithOptions(
    [
      calculatorTool,
      currentDateTool,
      webTool,
      webSearchTool,
      getLocalSearchTool(userId),
      getNotionTool(userId),
      getDriveTool(userId),
    ],
    llm,
    {
      agentType:
        "structured-chat-zero-shot-react-description",
      verbose: true,
    }
  );
}