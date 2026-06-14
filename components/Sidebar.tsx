"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  fetchSourceList,
  getSourceKey,
  getSourceName,
  ingestSourceText,
  ingestSourceUrl,
  isUnauthorizedApiError,
  removeSourceByName,
  uploadSourceFile,
  type SourceMetadata,
} from "@/lib/api/source-client";
import {
  getAuthorizedRequestConfig,
} from "@/lib/api/auth-client";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarQuickActions } from "@/components/sidebar/SidebarQuickActions";
import { SidebarSourcesList } from "@/components/sidebar/SidebarSourcesList";
import { SidebarThreadsList } from "@/components/sidebar/SidebarThreadsList";
import {
  closeSidebarDrawer,
  removeCachedSourceName,
} from "@/lib/client-storage";
import type { Thread } from "@/lib/api/thread-client";
import { queryKeys } from "@/lib/api/query-keys";

const SourceUploadDialog = dynamic(
  () =>
    import("@/components/sidebar/SourceUploadDialog").then(
      (mod) => mod.SourceUploadDialog,
    ),
);

type SidebarProps = {
  threads: Thread[];
  activeThreadId: string | null;
  creatingThread: boolean;
  selectedSources: string[];
  onCreateThread: () => void;
  onClearChats: () => void;
  onSelectThread: (threadId: string) => void;
  onSelectedSourcesChange: (sourceKeys: string[]) => void;
  clearingChats?: boolean;
};

function Sidebar({
  threads,
  activeThreadId,
  creatingThread,
  selectedSources,
  onCreateThread,
  onClearChats,
  onSelectThread,
  onSelectedSourcesChange,
  clearingChats,
}: SidebarProps) {
  const t = useTranslations("toast");
  const quickActions = useTranslations("sidebar.quickActions");
  const [dragActive, setDragActive] = useState(false);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceDialogMode, setSourceDialogMode] = useState<"link" | "text">(
    "link",
  );
  const [sourceDialogSubmitting, setSourceDialogSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: sources = [] } = useQuery({
    queryKey: queryKeys.sources,
    queryFn: fetchSourceList,
  });
  const removeSourceMutation = useMutation({
    mutationFn: async (source: SourceMetadata) => {
      const config = await getAuthorizedRequestConfig();

      if (!config) {
        throw new Error("Please sign in again.");
      }

      const name = getSourceName(source);
      const removed = await removeSourceByName(name, config);

      return {
        name,
        removed,
      };
    },
  });
  const handleClick = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const onSuccessUpload = useCallback(() => {
    closeSidebarDrawer();
  }, []);

  const toggleSelectedSource = useCallback((sourceKey: string) => {
    onSelectedSourcesChange(
      selectedSources.includes(sourceKey)
        ? selectedSources.filter((key) => key !== sourceKey)
        : [...selectedSources, sourceKey],
    );
  }, [onSelectedSourcesChange, selectedSources]);

  const refreshSources = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.sources,
    });
  }, [queryClient]);

  const handleRemoveSource = useCallback(async (s: SourceMetadata) => {
    const loading = toast.loading(t("removingSource"));

    try {
      /**
       * Delete only clicked source
       */
      const { name, removed } = await removeSourceMutation.mutateAsync(s);

      if (removed) {
        removeCachedSourceName(name);
        await refreshSources();
      }

      toast.success(t("sourceRemoved"), { id: loading });
    } catch {
      toast.error(t("removalFailed"), { id: loading });
    }
  }, [refreshSources, removeSourceMutation, t]);

  const processSelectedFile = useCallback(async (file: File) => {
    const loading = toast.loading(t("checkingSession"));

    try {
      const config = await getAuthorizedRequestConfig();

      if (!config) {
        toast.error(t("signInAgainBeforeUpload"), { id: loading });
        return;
      }

      toast.loading(t("processingContent"), { id: loading });

      await uploadSourceFile(file, config);

      await refreshSources();
      toast.success(t("uploadSuccessful"), {
        id: loading,
      });
      onSuccessUpload();
    } catch (error) {
      const description =
        isUnauthorizedApiError(error)
          ? t("sessionExpired")
          : t("genericError");

      toast.error(t("uploadFailed"), {
        description,
        id: loading,
      });
    }
  }, [onSuccessUpload, refreshSources, t]);

  const uploadSource = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    await processSelectedFile(file);
  }, [processSelectedFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    await processSelectedFile(file);
  }, [processSelectedFile]);

  const openSourceDialog = useCallback((mode: "link" | "text") => {
    if (sources.length >= 5) {
      toast.error(t("maxSources"));
      return;
    }

    setSourceDialogMode(mode);
    setSourceDialogOpen(true);
  }, [sources.length, t]);

  const submitSourceDialog = useCallback(async (mode: "link" | "text", value: string) => {
    const loading = toast.loading(t("processingContent"));

    try {
      setSourceDialogSubmitting(true);
      const config = await getAuthorizedRequestConfig();

      if (!config) {
        toast.error(t("signInAgain"), { id: loading });
        return;
      }

      if (mode === "link") {
        const sourceKind = await ingestSourceUrl(value, config);

        toast.success(t("uploadSuccessful"), {
          description: sourceKind === "youtube"
            ? t("youtubeIndexed")
            : t("articleIndexed"),
          id: loading,
        });
      } else {
        await ingestSourceText(value, config);

        toast.success(t("uploadSuccessful"), {
          description: t("textIndexed"),
          id: loading,
        });
      }

      await refreshSources();
      setSourceDialogOpen(false);
      onSuccessUpload();
    } catch {
      toast.error(t("uploadFailed"), {
        description: t("genericError"),
        id: loading,
      });
    } finally {
      setSourceDialogSubmitting(false);
    }
  }, [onSuccessUpload, refreshSources, t]);

  useEffect(() => {
    const sourceKeys = new Set(sources.map(getSourceKey));
    const nextSelectedSources = selectedSources.filter((sourceKey) =>
      sourceKeys.has(sourceKey),
    );

    if (nextSelectedSources.length !== selectedSources.length) {
      onSelectedSourcesChange(nextSelectedSources);
    }
  }, [sources, selectedSources, onSelectedSourcesChange]);

  return (
    <div className="w-full md:w-[300px] h-full bg-card flex flex-col border-r">
      <SidebarHeader />

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <SidebarQuickActions
          dragActive={dragActive}
          onAddFile={handleClick}
          onAddUrl={() => openSourceDialog("link")}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onPasteText={() => openSourceDialog("text")}
          onNewChat={onCreateThread}
          onClearChats={onClearChats}
          newChatDisabled={creatingThread}
          clearChatsDisabled={clearingChats || threads.length === 0}
        />

        <SidebarThreadsList
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={onSelectThread}
        />

        <SidebarSourcesList
          sources={sources}
          selectedSources={selectedSources}
          onRemoveSource={handleRemoveSource}
          onToggleSource={toggleSelectedSource}
        />
      </div>

      {/* HIDDEN INPUT */}
      <input
        type="file"
        aria-label={quickActions("fileInput")}
        accept=".pdf,.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.zip"
        ref={fileRef}
        className="hidden"
        onChange={uploadSource}
      />

      <SourceUploadDialog
        open={sourceDialogOpen}
        mode={sourceDialogMode}
        submitting={sourceDialogSubmitting}
        onOpenChange={setSourceDialogOpen}
        onModeChange={setSourceDialogMode}
        onSubmit={submitSourceDialog}
      />
    </div>
  );
}

export default memo(Sidebar);
