import { chunkText } from "./chunk";
import { getEmbedding } from "./embeddings";
import { getSupabase } from "./supabase";

export async function ingestDocument(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>,
  userId: string
) {
  const chunks = chunkText(text);
  const supabase = getSupabase();

  if (!supabase) {
    return Response.json({
      sources: [],
      error: "Supabase not configured",
    });
  }

  for (const chunk of chunks) {
    const embedding = await getEmbedding(chunk);

    await supabase.from("documents").insert({
      user_id: userId,
      content: chunk,
      metadata,
      embedding,
      env: process.env.NODE_ENV === "development" ? "dev" : "prod",
    });
  }

  return { chunks: chunks.length };
}
