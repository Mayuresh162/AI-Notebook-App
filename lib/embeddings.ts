import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const res = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });

    return res.data[0].embedding;
  } catch (err) {
    console.error("Embedding error:", err);
    throw new Error("Embedding generation failed");
  }
}
