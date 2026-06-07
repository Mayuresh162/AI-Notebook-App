import { getAgent } from "@/lib/agent";
import { getPrompt } from "@/lib/prompts";

export async function generateAnswerStream(
  question: string,
  context: string,
  mode:
    | "sources"
    | "web"
    | "hybrid"
    | "general",
  memory: {
    key: string;
    value: string;
  }[] = [],
  userId: string
) {

  const memoryText = memory.length > 0 ? memory.map((m) => `${m.key}: ${m.value}`).join("\n") : "No memory yet.";
  const prompt = getPrompt(question, context, mode, memoryText);

  try {
    const agent = await getAgent(userId);

    const result = await agent.invoke({
      input: prompt,
    });

    const text = result.output || "No response generated.";

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(text));
        controller.close();
      },
    });

    return stream;
  } catch (err) {
    console.error("Agent failed. Falling back to Groq stream...", err);

    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model:
            process.env.GROQ_MODEL ||
            "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI research assistant.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          stream: true,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Groq API error:", text);
      throw new Error("Failed to fetch response from Groq");
    }

    if (!res.body) {
      throw new Error("No response body from Groq");
    }

    return res.body;
  }
}