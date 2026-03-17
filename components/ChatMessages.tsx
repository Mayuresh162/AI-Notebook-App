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
    <div className="max-w-3xl mx-auto p-6 space-y-6">
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
                px-4 py-3 max-w-[80%] text-sm leading-relaxed
                ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }
              `}
            >
              <div className="whitespace-pre-wrap wrap-break-word">
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
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  {m.sources.map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (s: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
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
