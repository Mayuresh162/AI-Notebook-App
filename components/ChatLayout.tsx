"use client";

import { useEffect, useRef, useState } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import EmptyState from "./EmptyState";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function ChatLayout() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chat_messages");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sources, setSources] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chat_sources");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
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

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ question }),
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
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length > 0) {
      localStorage.setItem("chat_messages", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("chat_sources", JSON.stringify(sources));
  }, [sources]);

  return (
    <div className="flex-1 flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card shrink-0">
        <h2 className="font-medium">Research chat</h2>
        <Badge variant="secondary">{sources.length} sources</Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setMessages([]);
            localStorage.removeItem("chat_messages");
          }}
          className="cursor-pointer"
        >
          Clear
        </Button>
      </div>

      {/* Scroll ONLY here */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <ChatMessages messages={messages} loading={loading} />
              <div ref={bottomRef} />
            </>
          )}
        </ScrollArea>
      </div>

      {/* Input fixed at bottom */}
      <div className="shrink-0">
        <ChatInput ask={ask} loading={loading} />
      </div>
    </div>
  );
}
