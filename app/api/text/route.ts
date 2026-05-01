import { ingestDocument } from "@/lib/ingest";
import { requireUser } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const auth = await requireUser();

    if (auth.error)
      return Response.json({ error: auth.error }, { status: 400 });

    const { user } = auth;
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const ingestResult = await ingestDocument(text, {
      source: "text",
      name: text,
    }, user.id);

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
