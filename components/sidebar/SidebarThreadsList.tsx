import { memo } from "react";
import { useTranslations } from "next-intl";
import type { Thread } from "@/lib/api/thread-client";

type SidebarThreadsListProps = {
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
};

function SidebarThreadsListComponent({
  threads,
  activeThreadId,
  onSelectThread,
}: SidebarThreadsListProps) {
  const t = useTranslations("sidebar.threads");

  return (
    <div className="mt-7">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {t("heading")}
        </h2>

        <span className="text-xs text-muted-foreground">{threads.length}/5</span>
      </div>

      <div className="space-y-2">
        {threads.length === 0 ? (
          <div className="rounded-xl border bg-muted px-3 py-4 text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          threads.map((thread) => {
            const active = thread.id === activeThreadId;

            return (
              <button
                key={thread.id}
                type="button"
                aria-label={t("select", { title: thread.title })}
                onClick={() => onSelectThread(thread.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                  active
                    ? "border-foreground/20 bg-muted text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <p className="truncate text-sm">{thread.title}</p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export const SidebarThreadsList = memo(SidebarThreadsListComponent);
