"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChatInput({
  ask,
  loading,
}: {
  ask: (question: string) => Promise<void>;
  loading?: boolean;
}) {
  const [question, setQuestion] = useState("");

  function handleAsk() {
    if (!question.trim()) return;

    ask(question);

    setQuestion("");
  }

  return (
    <div className="border-t border-border bg-card pt-4 p-4">
      <div className="flex gap-3">
        <Input
          className="bg-input border-border"
          placeholder="Ask anything about your sources..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (loading) return;
              handleAsk();
            }
          }}
        />

        <Button
          variant="secondary"
          className="cursor-pointer"
          onClick={handleAsk}
          disabled={loading}
        >
          ➤
        </Button>
      </div>
    </div>
  );
}
