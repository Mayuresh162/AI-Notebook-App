"use client";

type ChatSseEvent =
  | {
      type: "status";
      status: string;
    }
  | {
      type: "token";
      text: string;
    }
  | {
      type: "sources";
      sources: unknown[];
    }
  | {
      type: "done";
    }
  | {
      type: "error";
      message: string;
    };

function parseSseMessage(message: string): ChatSseEvent | null {
  const lines = message.split("\n");
  const event = lines
    .find((line) => line.startsWith("event:"))
    ?.replace("event:", "")
    .trim();
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace("data:", "").trim())
    .join("\n");

  if (!event) return null;

  const parsed = data ? JSON.parse(data) : {};

  if (event === "status") {
    return {
      type: "status",
      status: String(parsed.status || ""),
    };
  }

  if (event === "token") {
    return {
      type: "token",
      text: String(parsed.text || ""),
    };
  }

  if (event === "sources") {
    return {
      type: "sources",
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  }

  if (event === "done") {
    return {
      type: "done",
    };
  }

  if (event === "error") {
    return {
      type: "error",
      message: String(parsed.message || "Stream failed"),
    };
  }

  return null;
}

export async function readChatSseStream(
  response: Response,
  onEvent: (event: ChatSseEvent) => void,
) {
  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const messages = buffer.split("\n\n");
    buffer = messages.pop() || "";

    for (const message of messages) {
      if (!message.trim()) continue;

      const event = parseSseMessage(message);

      if (event) {
        onEvent(event);
      }
    }
  }
}
