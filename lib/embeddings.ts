export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-small-en",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true }, // ✅ important for cold start
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("HF API error:", err);
      throw new Error("Failed to fetch embeddings");
    }

    const data = await res.json();

    // ⚠️ HF returns nested array sometimes
    const embedding = Array.isArray(data[0]) ? data[0] : data;

    return embedding;
  } catch (err) {
    console.error("Embedding error:", err);
    throw new Error("Embedding generation failed");
  }
}
