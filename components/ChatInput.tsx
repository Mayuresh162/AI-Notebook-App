"use client";

import { memo, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2 } from "lucide-react";

function ChatInputComponent({
  ask,
  loading,
  disabled,
  placeholder,
}: {
  ask: (question: string) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const t = useTranslations("chat");
  const [question, setQuestion] = useState("");
  const resolvedPlaceholder = placeholder || t("placeholder");

  const handleAsk = useCallback(async () => {
    const value = question.trim();

    if (!value || loading || disabled) return;

    setQuestion("");

    await ask(value);
  }, [ask, disabled, loading, question]);

  return (
    <div className="md:static fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-xl p-3 md:p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      <div className="max-w-4xl mx-auto flex items-center gap-3">

        <Input
          aria-label={t("inputLabel")}
          value={question}
          disabled={loading || disabled}
          placeholder={resolvedPlaceholder}
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
            border
            bg-muted
            px-4
            text-sm
            placeholder:text-muted-foreground
            focus-visible:ring-1
            focus-visible:ring-white/20
          "
        />

        <Button
          aria-label={loading ? t("sending") : t("submit")}
          onClick={handleAsk}
          disabled={loading || disabled || !question.trim()}
          className="
            h-12 w-12 shrink-0
            rounded-2xl
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

export default memo(ChatInputComponent);
