import { generateAnswerStream } from "@/lib/llm";
import { detectMode } from "@/lib/router";
import { requireUser } from "@/lib/supabase-server";
import { getChatRetrievalContext } from "@/lib/chat/retrieval";
import { createChatStreamResponse } from "@/lib/chat/stream-response";
import { parseChatRequest } from "@/lib/chat/request";
import { requireOwnedThread } from "@/lib/chat/thread-access";
import {
  createChatMessage,
  titleThreadFromQuestion,
} from "@/lib/chat/persistence";
import {
  consumeChatRateLimit,
  consumeDailyChatQuota,
} from "@/lib/server-controls";
import { enforceSameOriginRequest } from "@/lib/csrf";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const csrf = await enforceSameOriginRequest();

  if (csrf.error) return csrf.error;

  const auth = await requireUser();

  if (auth.error) return auth.error;

  const { user } = auth;
  const rate = await consumeChatRateLimit(user.id);

  if (rate.error) return rate.error;

  const quota = await consumeDailyChatQuota(user.id);

  if (quota.error) return quota.error;

  const parsed = await parseChatRequest(req);

  if (parsed.error) return parsed.error;

  const { question, memory, threadId, selectedSources } = parsed.data;
  const ownedThread = await requireOwnedThread(threadId, user.id);

  if (ownedThread.error) return ownedThread.error;

  await createChatMessage({
    threadId,
    userId: user.id,
    role: "user",
    content: question,
  });
  await titleThreadFromQuestion(threadId, user.id, question);

  const { docs: finalDocs, context } = await getChatRetrievalContext(
    question,
    user.id,
    selectedSources,
  );

  const mode = detectMode(question, finalDocs.length > 0);

  const stream = await generateAnswerStream(
    question,
    context,
    mode,
    memory,
    user.id,
  );

  return createChatStreamResponse(stream, finalDocs, {
    onComplete: async ({ text, sources }) => {
      if (!text.trim()) return;

      await createChatMessage({
        threadId,
        userId: user.id,
        role: "assistant",
        content: text,
        sources,
      });
    },
  });
}
