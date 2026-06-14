import { memo, useEffect, useState } from "react";
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
  onClearChats: () => void;
  newChatDisabled?: boolean;
  clearChatsDisabled?: boolean;
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
  onClearChats,
  newChatDisabled,
  clearChatsDisabled,
}: SidebarQuickActionsProps) {
  const t = useTranslations("sidebar.quickActions");
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => {
    if (!confirmingClear) return;

    const timeout = window.setTimeout(() => {
      setConfirmingClear(false);
    }, 5_000);

    return () => window.clearTimeout(timeout);
  }, [confirmingClear]);

  function handleClearChats() {
    if (clearChatsDisabled) return;

    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }

    setConfirmingClear(false);
    onClearChats();
  }

  return (
    <div className="space-y-2">
      <div
        aria-label={t("dropzone")}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-xl border border-dashed transition ${
          dragActive
            ? "border-foreground bg-muted"
            : "border-border bg-transparent"
        }`}
      >
        <Button
          variant="outline"
          onClick={onAddFile}
          className="w-full h-11 rounded-xl"
        >
          📄 {t("addFile")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={onAddUrl}
          className="h-10 rounded-xl"
        >
          🔗 {t("addUrl")}
        </Button>

        <Button
          variant="outline"
          onClick={onPasteText}
          className="h-10 rounded-xl"
        >
          📝 {t("pasteText")}
        </Button>
      </div>

      <Button
        variant="outline"
        onClick={onNewChat}
        disabled={newChatDisabled}
        className="w-full h-10 rounded-xl"
      >
        ✨ {t("newChat")}
      </Button>

      <Button
        variant="outline"
        onClick={handleClearChats}
        disabled={clearChatsDisabled}
        className="w-full h-10 rounded-xl text-red-500 hover:bg-red-500/10"
      >
        {confirmingClear ? t("confirmClearChats") : t("clearChats")}
      </Button>
    </div>
  );
}

export const SidebarQuickActions = memo(SidebarQuickActionsComponent);
