"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  connectGoogleDrive,
  connectNotion,
  fetchSourceList,
  fetchUploadIngestionStatus,
  getSourceKey,
  getSourceName,
  ingestSourceText,
  ingestSourceUrl,
  isUnauthorizedApiError,
  removeSourceByName,
  syncConnectedSources,
  UPLOAD_STATUS_POLL_MS,
  uploadSourceFile,
  type SourceMetadata,
} from "@/lib/api/source-client";
import {
  getAuthorizedRequestConfig,
  signOutAndRedirect,
} from "@/lib/api/auth-client";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarIntegrations } from "@/components/sidebar/SidebarIntegrations";
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
  onSelectThread: (threadId: string) => void;
  onSelectedSourcesChange: (sourceKeys: string[]) => void;
};

function Sidebar({
  threads,
  activeThreadId,
  creatingThread,
  selectedSources,
  onCreateThread,
  onSelectThread,
  onSelectedSourcesChange,
}: SidebarProps) {
  const t = useTranslations("toast");
  const quickActions = useTranslations("sidebar.quickActions");
  const [dragActive, setDragActive] = useState(false);
  const [syncing, setSyncing] = useState(false);
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
  const syncSourcesMutation = useMutation({
    mutationFn: async () => {
      const config = await getAuthorizedRequestConfig();

      if (!config) {
        throw new Error("Please sign in again.");
      }

      await syncConnectedSources(config);
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

  const pollUploadStatus = useCallback(async (
    sessionId: string,
    config: Awaited<ReturnType<typeof getAuthorizedRequestConfig>>,
  ) => {
    if (!config) return "queued";

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, UPLOAD_STATUS_POLL_MS));

      const status = await queryClient.fetchQuery({
        queryKey: queryKeys.uploadStatus(sessionId),
        queryFn: () => fetchUploadIngestionStatus(sessionId, config),
      });

      if (status === "completed" || status === "failed") return status;
    }

    return "queued";
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

      toast.loading(t("uploadingFile", { progress: 0 }), { id: loading });

      const upload = await uploadSourceFile(file, config, (progress) => {
        toast.loading(t("uploadingFile", { progress }), { id: loading });
      });

      toast.success(t("queuedForIndexing"), {
        description: t("queuedDescription"),
        id: loading,
      });
      onSuccessUpload();

      void pollUploadStatus(upload.sessionId, config).then((status) => {
        if (status === "completed") {
          void refreshSources();
        } else if (status === "failed") {
          toast.error(t("indexingFailed"), {
            description: t("indexingFailedDescription"),
          });
        }
      });
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
  }, [onSuccessUpload, pollUploadStatus, refreshSources, t]);

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

  const logout = useCallback(async () => {
    await signOutAndRedirect();
  }, []);

  const handleSync = useCallback(async () => {
    const id = toast.loading(t("syncingSources"));

    try {
      setSyncing(true);
      await syncSourcesMutation.mutateAsync();

      toast.success(t("sourcesSynced"), { id });
      await refreshSources();
    } catch {
      toast.error(t("syncFailed"), { id });
    } finally {
      setSyncing(false);
    }
  }, [refreshSources, syncSourcesMutation, t]);

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
    <div className="w-full md:w-[300px] h-full bg-[#111111] flex flex-col border-r border-white/5">
      <SidebarHeader onLogout={logout} />

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
          newChatDisabled={creatingThread}
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

        <SidebarIntegrations
          syncing={syncing}
          onConnectGoogle={connectGoogleDrive}
          onConnectNotion={connectNotion}
          onSync={handleSync}
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
