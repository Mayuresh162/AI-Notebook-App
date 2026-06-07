"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import ChatLayout from "@/components/ChatLayout";
import SidebarDrawer from "@/components/SidebarDrawer";
import UserMenu from "@/components/UserMenu";
import { getAuthorizedRequestConfig } from "@/lib/api/auth-client";
import {
  createThread,
  fetchThreads,
  type Thread,
} from "@/lib/api/thread-client";
import { queryKeys } from "@/lib/api/query-keys";

export default function AppShell() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [creatingThread, setCreatingThread] = useState(false);
  const queryClient = useQueryClient();
  const { data: threads = [] } = useQuery({
    queryKey: queryKeys.threads,
    queryFn: async () => {
      const config = await getAuthorizedRequestConfig();

      if (!config) return [] as Thread[];

      return fetchThreads(config);
    },
  });
  const createThreadMutation = useMutation({
    mutationFn: async () => {
      const config = await getAuthorizedRequestConfig();

      if (!config) {
        throw new Error("Please sign in again.");
      }

      return createThread(config);
    },
    onSuccess(thread) {
      queryClient.setQueryData<Thread[]>(queryKeys.threads, (current = []) => [
        thread,
        ...current,
      ]);
      setActiveThreadId(thread.id);
    },
  });

  const loadThreads = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.threads,
    });
    const config = await getAuthorizedRequestConfig();

    if (!config) return;

    const threadList = await fetchThreads(config);

    queryClient.setQueryData<Thread[]>(queryKeys.threads, threadList);
    setActiveThreadId((current) => current || threadList[0]?.id || null);
  }, [queryClient]);

  const handleCreateThread = useCallback(async () => {
    const loading = toast.loading("Creating chat...");

    try {
      setCreatingThread(true);
      await createThreadMutation.mutateAsync();
      toast.success("New chat created", { id: loading });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create chat";

      toast.error(message, { id: loading });
    } finally {
      setCreatingThread(false);
    }
  }, [createThreadMutation]);

  useEffect(() => {
    setActiveThreadId((current) => current || threads[0]?.id || null);
  }, [threads]);

  const sidebar = useMemo(() => (
    <Sidebar
      threads={threads}
      activeThreadId={activeThreadId}
      creatingThread={creatingThread}
      selectedSources={selectedSources}
      onCreateThread={handleCreateThread}
      onSelectThread={setActiveThreadId}
      onSelectedSourcesChange={setSelectedSources}
    />
  ), [
    activeThreadId,
    creatingThread,
    handleCreateThread,
    selectedSources,
    threads,
  ]);

  return (
    <div className="h-screen bg-[#0a0a0a] overflow-hidden md:p-4">
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 md:hidden">
        <div className="flex items-center gap-3">
          <SidebarDrawer>{sidebar}</SidebarDrawer>

          <span className="font-medium">AI Notebook</span>
        </div>

        <UserMenu />
      </header>

      <div className="h-full flex overflow-hidden rounded-none md:rounded-3xl border border-white/5 bg-[#111111]">
        <div className="hidden md:flex">{sidebar}</div>

        <ChatLayout
          activeThreadId={activeThreadId}
          selectedSources={selectedSources}
          onThreadUpdated={loadThreads}
        />
      </div>
    </div>
  );
}
