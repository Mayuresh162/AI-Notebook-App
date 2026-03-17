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

  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3",
      prompt,
      stream: true,
    }),
  });

  return res.body;
}
