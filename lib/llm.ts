export async function generateAnswerStream(question: string, context: string) {
  const prompt = `
You are an AI research assistant.

Answer using the provided sources.

Sources:
${context}

Question:
${question}

Answer:
`;

  // const res = await fetch("http://localhost:11434/api/generate", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     model: "llama3",
  //     prompt,
  //     stream: true,
  //   }),
  // });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      stream: true,
    }),
  });

  // ✅ Handle API errors
  if (!res.ok) {
    const text = await res.text();
    console.error("Groq API error:", text);
    throw new Error("Failed to fetch response from Groq");
  }

  // ✅ Ensure stream exists
  if (!res.body) {
    throw new Error("No response body from Groq");
  }

  return res.body;
}
