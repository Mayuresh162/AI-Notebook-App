import { sanitizeSourcesForClient } from "@/lib/security";
import type { SearchMatch } from "@/lib/chat/retrieval";
import type { SanitizedSource } from "@/lib/security";

type ChatStreamCompletePayload = {
  text: string;
  sources: SanitizedSource[];
};

type ChatStreamResponseOptions = {
  onComplete?: (payload: ChatStreamCompletePayload) => Promise<void> | void;
};

function encodeSseEvent(
  encoder: TextEncoder,
  event: string,
  data: Record<string, unknown>,
) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function createChatStreamResponse(
  stream: ReadableStream<Uint8Array> | null | undefined,
  sources: SearchMatch[],
  options: ChatStreamResponseOptions = {},
) {
  return new Response(
    new ReadableStream({
      async start(controller) {
        if (!stream) {
          controller.close();
          return;
        }

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        controller.enqueue(
          encodeSseEvent(encoder, "status", {
            status: "streaming",
          }),
        );

        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, {
            stream: true,
          });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed) continue;

            /**
             * CASE 1:
             * Agent fallback stream returns plain text
             */
            if (!trimmed.startsWith("data:")) {
              fullText += trimmed;
              controller.enqueue(
                encodeSseEvent(encoder, "token", {
                  text: trimmed,
                }),
              );
              continue;
            }

            /**
             * CASE 2:
             * Groq SSE stream
             */
            const jsonStr = trimmed.replace("data:", "").trim();

            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);

              const token = parsed.choices?.[0]?.delta?.content || "";

              if (token) {
                fullText += token;
                controller.enqueue(
                  encodeSseEvent(encoder, "token", {
                    text: token,
                  }),
                );
              }
            } catch {
              controller.enqueue(
                encodeSseEvent(encoder, "error", {
                  message: "Failed to parse stream chunk",
                }),
              );
            }
          }
        }

        const sanitizedSources = sanitizeSourcesForClient(sources);

        try {
          await options.onComplete?.({
            text: fullText,
            sources: sanitizedSources,
          });
        } catch {
          controller.enqueue(
            encodeSseEvent(encoder, "error", {
              message: "Failed to persist assistant message",
            }),
          );
        }

        controller.enqueue(
          encodeSseEvent(encoder, "sources", {
            sources: sanitizedSources,
          }),
        );

        controller.enqueue(
          encodeSseEvent(encoder, "done", {
            done: true,
          }),
        );

        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    },
  );
}
