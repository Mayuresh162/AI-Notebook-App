"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2 } from "lucide-react";

export default function ChatInput({
  ask,
  loading,
}: {
  ask: (question: string) => Promise<void>;
  loading?: boolean;
}) {
  const [question, setQuestion] = useState("");

  async function handleAsk() {
    const value = question.trim();

    if (!value || loading) return;

    setQuestion("");

    await ask(value);
  }

  return (
    <div className="md:static fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl p-3 md:p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.35)]">
      <div className="max-w-4xl mx-auto flex items-center gap-3">

        <Input
          value={question}
          disabled={loading}
          placeholder="Ask anything about your sources..."
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAsk();
            }
          }}
          className="
            h-12 md:h-13 flex-1
            rounded-2xl
            border border-white/10
            bg-[#151515]
            px-4
            text-sm text-white
            placeholder:text-zinc-500
            focus-visible:ring-1
            focus-visible:ring-white/20
          "
        />

        <Button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="
            h-12 w-12 shrink-0
            rounded-2xl
            bg-white text-black
            hover:bg-zinc-200
            active:scale-95
            transition-all
            disabled:opacity-50
          "
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ArrowUp size={18} />
          )}
        </Button>

      </div>
    </div>
  );
}