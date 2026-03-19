import { ingestDocument } from "@/lib/ingest";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const ingestResult = await ingestDocument(text, {
      source: "text",
      name: text,
    });

    const finalChunks =
      ingestResult instanceof Response
        ? (await ingestResult.json()).chunks
        : ingestResult.chunks;

    return Response.json({
      chunks: finalChunks,
    });
  } catch (error) {
    console.error("Text ingestion error:", error);

    return Response.json({ error: "Failed to process text" }, { status: 500 });
  }
}
