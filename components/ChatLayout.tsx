"use client";

import { useEffect, useRef, useState } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { getMemory } from "@/lib/tools/memory";

export default function ChatLayout() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem("chat_messages");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function ask(question: string) {
    if (!question) return;

    setLoading(true);

    setMessages((prev) => [...prev, { role: "user", content: question }]);

    let assistantIndex = 0;
    let fullText = "";

    setMessages((prev) => {
      const updated = [...prev, { role: "assistant", content: "" }];
      assistantIndex = updated.length - 1;
      return updated;
    });

    const memory = getMemory();

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        question,
        memory,
      }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { value, done } = await reader!.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const json = JSON.parse(line);

          if (json.response) {
            fullText += json.response;

            setMessages((prev) => {
              const updated = [...prev];
              updated[assistantIndex] = {
                ...updated[assistantIndex],
                content: fullText,
              };
              return updated;
            });
          }

          if (json.done) {
            if (json.sources) {
              setSources(json.sources);

              setMessages((prev) => {
                const updated = [...prev];

                updated[assistantIndex] = {
                  ...updated[assistantIndex],
                  sources: json.sources,
                };

                return updated;
              });
            }
          }
        } catch (err) {
          console.error("Stream parse error", err);
        }
      }
    }

    setLoading(false);

    setMessages((prev) => {
      localStorage.setItem("chat_messages", JSON.stringify(prev));
      return prev;
    });
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    });
  }, [messages, loading]);

  return (
  <div className="flex flex-col h-full flex-1 overflow-hidden">

    {/* ONLY THIS SCROLLS */}
    <div className="flex-1 min-h-0 overflow-y-auto">
      <ChatMessages
        messages={messages}
        loading={loading}
      />
      <div ref={bottomRef} className="h-1" />
    </div>

    {/* Sticky Input */}
    <div className="shrink-0">
      <ChatInput ask={ask} loading={loading} />
    </div>

  </div>
);
}
