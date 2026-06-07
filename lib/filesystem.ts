import { getEmbedding } from "./embeddings";
import { getSupabase } from "./supabase";

function chunkText(
  text: string,
  size = 1200
) {
  const chunks = [];

  for (
    let i = 0;
    i < text.length;
    i += size
  ) {
    chunks.push(
      text.slice(i, i + size)
    );
  }

  return chunks;
}

export async function embedAndStore(
  text: string,
  name: string,
  type: string,
  userId: string
) {
  const supabase = getSupabase();

  const chunks = chunkText(text);

  for (const chunk of chunks) {
    const embedding =
      await getEmbedding(chunk);

    await supabase
      .from("documents")
      .insert({
        user_id: userId,
        content: chunk,
        embedding,
        metadata: {
          name,
          source: "filesystem",
          fileType: type,
          created_at: new Date().toISOString(),
        },
        env: process.env.NODE_ENV === "development" ? "dev" : "prod",
      });
  }
}