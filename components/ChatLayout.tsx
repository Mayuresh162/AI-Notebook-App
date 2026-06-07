"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { getMemory } from "@/lib/tools/memory";
import type { SanitizedSource } from "@/lib/security";
import { readChatSseStream } from "@/lib/chat/sse-client";
import { getAuthorizedRequestConfig } from "@/lib/api/auth-client";
import {
  fetchThreadMessages,
  type ThreadMessage,
} from "@/lib/api/thread-client";
import { queryKeys } from "@/lib/api/query-keys";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: SanitizedSource[];
};

type ChatLayoutProps = {
  activeThreadId: string | null;
  selectedSources?: string[];
  onThreadUpdated?: () => void | Promise<void>;
};

export default function ChatLayout({
  activeThreadId,
  selectedSources = [],
  onThreadUpdated,
}: ChatLayoutProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [streamStatus, setStreamStatus] = useState<
    "idle" | "thinking" | "streaming" | "error"
  >("idle");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const loadOlderRef = useRef<() => void>(() => {});
  const queryClient = useQueryClient();
  const selectedSourcesKey = useMemo(
    () => selectedSources.join("\u001f"),
    [selectedSources],
  );
  const selectedSourcesPayload = useMemo(
    () => (selectedSourcesKey ? selectedSources : []),
    [selectedSources, selectedSourcesKey],
  );
  const initialMessagesQuery = useQuery({
    queryKey: queryKeys.threadMessages(activeThreadId),
    enabled: Boolean(activeThreadId),
    queryFn: async () => {
      if (!activeThreadId) {
        return {
          messages: [],
          nextCursor: null,
        };
      }

      const config = await getAuthorizedRequestConfig();

      if (!config) {
        return {
          messages: [],
          nextCursor: null,
        };
      }

      return fetchThreadMessages(config, activeThreadId, {
        limit: 50,
      });
    },
  });
  const { data: initialMessagesData, refetch: refetchInitialMessages } =
    initialMessagesQuery;

  const mapThreadMessage = useCallback((message: ThreadMessage): Message => {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      sources: message.sources || undefined,
    };
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (!activeThreadId || !nextCursor || loadingOlder) return;

    const scrollContainer = scrollRef.current;
    const previousHeight = scrollContainer?.scrollHeight || 0;
    const config = await getAuthorizedRequestConfig();

    if (!config) return;

    setLoadingOlder(true);

    try {
      const result = await fetchThreadMessages(config, activeThreadId, {
        limit: 50,
        before: nextCursor,
      });

      setMessages((current) => [
        ...result.messages.map(mapThreadMessage),
        ...current,
      ]);
      setNextCursor(result.nextCursor);

      requestAnimationFrame(() => {
        if (!scrollContainer) return;

        scrollContainer.scrollTop =
          scrollContainer.scrollHeight - previousHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [activeThreadId, loadingOlder, mapThreadMessage, nextCursor]);

  const ask = useCallback(async (question: string) => {
    if (!question || !activeThreadId) return;

    const config = await getAuthorizedRequestConfig();

    if (!config) {
      setStreamStatus("error");
      return;
    }

    setStreamStatus("thinking");

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user" as const,
        content: question,
      },
    ]);

    let assistantIndex = 0;
    const assistantTempId = `assistant-${Date.now()}`;
    let fullText = "";
    let pendingText = "";
    let assistantSources: SanitizedSource[] = [];
    let frame: number | null = null;
    let threadRefreshQueued = false;

    const refreshThreadList = () => {
      if (threadRefreshQueued) return;

      threadRefreshQueued = true;
      void onThreadUpdated?.();
    };

    const flushPendingText = () => {
      if (!pendingText) return;

      fullText += pendingText;
      pendingText = "";

      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIndex] = {
          ...updated[assistantIndex],
          content: fullText,
        };
        return updated;
      });
    };

    const queueToken = (token: string) => {
      pendingText += token;

      if (frame !== null) return;

      frame = requestAnimationFrame(() => {
        frame = null;
        flushPendingText();
      });
    };

    setMessages((prev) => {
      const updated = [
        ...prev,
        {
          id: assistantTempId,
          role: "assistant" as const,
          content: "",
        },
      ];
      assistantIndex = updated.length - 1;
      return updated;
    });

    const memory = getMemory();

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        question,
        memory,
        threadId: activeThreadId,
        selectedSources: selectedSourcesPayload,
      }),
    });

    try {
      await readChatSseStream(res, (event) => {
        if (event.type === "status") {
          setStreamStatus("streaming");
          refreshThreadList();
        }

        if (event.type === "token") {
          setStreamStatus("streaming");
          queueToken(event.text);
        }

        if (event.type === "sources") {
          flushPendingText();
          assistantSources = event.sources as SanitizedSource[];

          setMessages((prev) => {
            const updated = [...prev];

            updated[assistantIndex] = {
              ...updated[assistantIndex],
              sources: assistantSources,
            };

            return updated;
          });
        }

        if (event.type === "error") {
          setStreamStatus("error");
        }
      });

      flushPendingText();
      void queryClient.invalidateQueries({
        queryKey: queryKeys.threadMessages(activeThreadId),
      });
      await refetchInitialMessages();
      refreshThreadList();
      setStreamStatus("idle");
    } catch {
      setStreamStatus("error");
    } finally {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    }

  }, [
    activeThreadId,
    onThreadUpdated,
    queryClient,
    refetchInitialMessages,
    selectedSourcesPayload,
  ]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    const nearBottom = scrollContainer
      ? scrollContainer.scrollHeight -
          scrollContainer.scrollTop -
          scrollContainer.clientHeight <
        180
      : true;

    if (streamStatus === "idle" && !nearBottom) return;

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    });
  }, [messages.length, streamStatus]);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      setNextCursor(null);
      return;
    }

    setMessages([]);
    setNextCursor(null);
  }, [activeThreadId]);

  useEffect(() => {
    if (!initialMessagesData) return;

    setMessages(initialMessagesData.messages.map(mapThreadMessage));
    setNextCursor(initialMessagesData.nextCursor);
  }, [initialMessagesData, mapThreadMessage]);

  useEffect(() => {
    loadOlderRef.current = () => {
      void loadOlderMessages();
    };
  }, [loadOlderMessages]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;

    if (!scrollContainer) return;

    const element = scrollContainer;

    function handleScroll() {
      if (element.scrollTop < 120) {
        loadOlderRef.current();
      }
    }

    element.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, [activeThreadId]);

  return (
  <div
    data-thread-id={activeThreadId || undefined}
    className="flex flex-col h-full flex-1 overflow-hidden"
  >

    {/* ONLY THIS SCROLLS */}
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
      <ChatMessages
        messages={messages}
        streamStatus={streamStatus}
        scrollContainerRef={scrollRef}
      />
      {!activeThreadId && (
        <div className="h-full flex items-center justify-center px-6 text-center text-sm text-zinc-500">
          Create a chat to start.
        </div>
      )}
      <div ref={bottomRef} className="h-1" />
    </div>

    {/* Sticky Input */}
    <div className="shrink-0">
      <ChatInput
        ask={ask}
        loading={streamStatus !== "idle"}
        disabled={!activeThreadId}
        placeholder={
          activeThreadId
            ? "Ask anything about your sources..."
            : "Create a chat to start..."
        }
      />
    </div>

  </div>
);
}
