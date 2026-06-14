import { memo } from "react";
import { Check, CircleX } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  getSourceKey,
  type SourceMetadata,
} from "@/lib/api/source-client";
import { cn } from "@/lib/utils";

type SidebarSourcesListProps = {
  sources: SourceMetadata[];
  selectedSources: string[];
  onRemoveSource: (source: SourceMetadata) => void;
  onToggleSource: (sourceKey: string) => void;
};

function getSourceIcon(source?: string) {
  if (source === "pdf" || source === "filesystem") return "📄";
  if (source === "youtube") return "🎥";
  if (source === "github") return "💻";
  if (source === "url") return "🌐";
  if (source === "text") return "📝";

  return "📁";
}

function SidebarSourcesListComponent({
  sources,
  selectedSources,
  onRemoveSource,
  onToggleSource,
}: SidebarSourcesListProps) {
  const t = useTranslations("sidebar.sources");

  return (
    <div className="mt-7">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {t("heading")}
        </h2>

        <span className="text-xs text-muted-foreground">{sources.length}</span>
      </div>

      <div className="space-y-2">
        {sources.length === 0 ? (
          <div className="rounded-xl border bg-muted px-3 py-4 text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          sources.map((sourceMetadata) => {
            const source = sourceMetadata?.source;
            const label = sourceMetadata?.name || sourceMetadata?.url || t("untitled");
            const sourceKey = getSourceKey(sourceMetadata);
            const selected = selectedSources.includes(sourceKey);
            const icon = getSourceIcon(source);

            return (
              <div
                key={sourceKey}
                className={cn(
                  "group flex items-center gap-2 rounded-xl border px-3 py-2 transition",
                  selected
                    ? "border-foreground/20 bg-muted"
                    : "border-border bg-card",
                )}
              >
                <button
                  type="button"
                  aria-label={t(selected ? "deselect" : "select", {
                    name: label,
                  })}
                  aria-checked={selected}
                  role="checkbox"
                  onClick={() => onToggleSource(sourceKey)}
                  className={cn(
                    "flex size-4 shrink-0 cursor-pointer items-center justify-center rounded border transition",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent text-transparent hover:border-foreground/40",
                  )}
                >
                  <Check size={12} strokeWidth={3} />
                </button>

                <span>{icon}</span>

                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm">{label}</p>

                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    {source || t("generic")}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label={t("remove", { name: label })}
                  onClick={() => onRemoveSource(sourceMetadata)}
                  className="cursor-pointer text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition"
                >
                  <CircleX size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export const SidebarSourcesList = memo(SidebarSourcesListComponent);
