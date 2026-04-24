import { Card } from "@/components/ui/card";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources: [];
};

export default function ChatMessages({
  messages,
  loading,
}: {
  messages: Message[];
  loading?: boolean;
}) {
  return (
    <div className="max-w-3xl mx-auto px-3 py-4 md:p-6 space-y-5 pb-40 md:pb-8">
      {messages.map((m, i) => {
        const isUser = m.role === "user";
        const isLast = i === messages.length - 1;

        return (
          <div
            key={i}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`
                px-4 py-3 md:px-5 md:py-4
                max-w-[88%] md:max-w-[80%]
                text-[15px] leading-7
                rounded-3xl border shadow-sm
                transition-all duration-200

                ${
                  isUser
                    ? "ml-auto bg-white text-black border-white"
                    : "bg-[#171717] text-white border-white/5"
                }
              `}
            >
              <div className="whitespace-pre-wrap break-words">
                {m.content}

                {!isUser && m.sources?.length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {m.sources.map((_, i) => `[${i + 1}]`).join(" ")}
                  </span>
                )}

                {/* Streaming cursor */}
                {!isUser && isLast && loading && (
                  <span className="animate-pulse ml-1">▍</span>
                )}
              </div>

              {!isUser && m.sources?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/5 text-xs text-zinc-400 space-y-2">
                  {m.sources.map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (s: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1"
                      >
                        <span>[{i + 1}]</span>
                        <span className="truncate">
                          {s.metadata?.name || s.metadata?.url || "Source"}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
