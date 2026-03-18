import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const res = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return res.data[0].embedding;
  } catch (err) {
    console.error("Embedding error:", err);
    throw new Error("Embedding generation failed");
  }
}
