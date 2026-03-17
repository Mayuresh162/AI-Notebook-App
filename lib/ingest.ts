import { chunkText } from "./chunk";
import { getEmbedding } from "./embeddings";
import { supabase } from "./supabase";

export async function ingestDocument(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>,
) {
  const chunks = chunkText(text);

  for (const chunk of chunks) {
    const embedding = await getEmbedding(chunk);

    await supabase.from("documents").insert({
      content: chunk,
      metadata,
      embedding,
    });
  }

  return { chunks: chunks.length };
}
