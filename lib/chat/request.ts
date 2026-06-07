import {
  readJsonObject,
  sanitizeMemory,
  sanitizeSourceKeys,
  validateQuestion,
} from "@/lib/security";

export async function parseChatRequest(req: Request) {
  const body = await readJsonObject(req);

  if (body.error) return { error: body.error };

  const questionResult = validateQuestion(body.data);

  if (questionResult.error) return { error: questionResult.error };

  const threadId = body.data.threadId;

  if (typeof threadId !== "string" || !threadId.trim()) {
    return {
      error: Response.json(
        { success: false, error: "threadId is required" },
        { status: 400 },
      ),
    };
  }

  return {
    data: {
      question: questionResult.value,
      memory: sanitizeMemory(body.data.memory),
      threadId: threadId.trim(),
      selectedSources: sanitizeSourceKeys(body.data.selectedSources),
    },
  };
}
