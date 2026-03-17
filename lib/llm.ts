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

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      stream: true,
    }),
  });

  return res.body;
}
