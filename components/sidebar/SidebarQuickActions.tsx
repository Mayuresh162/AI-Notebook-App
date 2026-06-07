import { memo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type SidebarQuickActionsProps = {
  dragActive: boolean;
  onAddFile: () => void;
  onAddUrl: () => void;
  onDragLeave: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onPasteText: () => void;
  onNewChat: () => void;
  newChatDisabled?: boolean;
};

function SidebarQuickActionsComponent({
  dragActive,
  onAddFile,
  onAddUrl,
  onDragLeave,
  onDragOver,
  onDrop,
  onPasteText,
  onNewChat,
  newChatDisabled,
}: SidebarQuickActionsProps) {
  const t = useTranslations("sidebar.quickActions");

  return (
    <div className="space-y-2">
      <div
        aria-label={t("dropzone")}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-xl border border-dashed transition ${
          dragActive
            ? "border-white bg-white/10"
            : "border-white/10 bg-transparent"
        }`}
      >
        <Button
          onClick={onAddFile}
          className="w-full h-11 rounded-xl bg-white text-black hover:bg-zinc-200"
        >
          📄 {t("addFile")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={onAddUrl}
          className="h-10 rounded-xl bg-[#151515] border-white/10 hover:bg-[#1d1d1d]"
        >
          🔗 {t("addUrl")}
        </Button>

        <Button
          variant="outline"
          onClick={onPasteText}
          className="h-10 rounded-xl bg-[#151515] border-white/10 hover:bg-[#1d1d1d]"
        >
          📝 {t("pasteText")}
        </Button>
      </div>

      <Button
        variant="outline"
        onClick={onNewChat}
        disabled={newChatDisabled}
        className="w-full h-10 rounded-xl bg-[#151515] border-white/10 hover:bg-[#1d1d1d]"
      >
        ✨ {t("newChat")}
      </Button>
    </div>
  );
}

export const SidebarQuickActions = memo(SidebarQuickActionsComponent);
