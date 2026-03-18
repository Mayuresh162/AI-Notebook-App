import { getEmbedding } from "@/lib/embeddings";
import { searchDocuments } from "@/lib/search";
import { generateAnswerStream } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { question } = await req.json();

  const queryEmbedding = await getEmbedding(question);

  const rawMatches = await searchDocuments(queryEmbedding);

  const matches = Array.isArray(rawMatches)
    ? rawMatches
    : rawMatches?.data || rawMatches?.matches || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context = matches.map((m: any) => m.content || "").join("\n");

  const stream = await generateAnswerStream(question, context);

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

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.replace("data:", "").trim();

            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);

              const token = parsed.choices?.[0]?.delta?.content || "";

              if (token) {
                controller.enqueue(
                  encoder.encode(JSON.stringify({ response: token }) + "\n"),
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
      },
    },
  );
}
