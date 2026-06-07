import { getEmbedding } from "@/lib/embeddings";
import { searchDocuments } from "@/lib/search";
import { generateAnswerStream } from "@/lib/llm";
import { detectMode } from "@/lib/router";
import { requireUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireUser();

  if (auth.error) return auth.error;

  const { user } = auth;
  const { question, memory = [] } = await req.json();

  const queryEmbedding = await getEmbedding(question);

  const rawMatches = await searchDocuments(queryEmbedding, user.id);

  const matches = Array.isArray(rawMatches)
    ? rawMatches
    : rawMatches?.data || rawMatches?.matches || [];

  const sorted = [...matches].sort(
    (a: any, b: any) => (b.similarity || 0) - (a.similarity || 0),
  );

  const unique = new Map();

  for (const doc of sorted) {
    const key = doc.content?.slice(0, 100);

    if (key && !unique.has(key)) {
      unique.set(key, doc);
    }
  }

  // STEP 3: take top 5
  const finalDocs = Array.from(unique.values()).slice(0, 5);

  const context = finalDocs
    .map(
      (d: any, i: number) =>
        `Source ${i + 1} (${d.metadata?.source || "unknown"}):
    ${d.content}`,
    )
    .join("\n\n---\n\n");

  const mode = detectMode(question, finalDocs.length > 0);

  const stream = await generateAnswerStream(
    question,
    context,
    mode,
    memory,
    user.id,
  );

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

        let buffer = "";

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
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    response: trimmed,
                  }) + "\n",
                ),
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
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      response: token,
                    }) + "\n",
                  ),
                );
              }
            } catch (err) {
              console.error("Stream parse error", err);
            }
          }
        }

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              done: true,
              sources: matches,
            }) + "\n",
          ),
        );

        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-transform",
      },
    },
  );
}
