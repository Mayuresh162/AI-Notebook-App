import { getEmbedding } from "@/lib/embeddings";
import { searchDocuments } from "@/lib/search";
import { generateAnswerStream } from "@/lib/llm";

export async function POST(req: Request) {
  const { question } = await req.json();

  const queryEmbedding = await getEmbedding(question);

  const matches = await searchDocuments(queryEmbedding);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context = matches.map((m: any) => m.content).join("\n");

  const stream = await generateAnswerStream(question, context);

  return new Response(
    new ReadableStream({
      async start(controller) {
        if (stream) {
          const reader = stream.getReader();
          const encoder = new TextEncoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            controller.enqueue(value);
          }

          // ✅ send sources at end
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ done: true, sources: matches }) + "\n",
            ),
          );

          controller.close();
        }
      },
    }),
  );
}
