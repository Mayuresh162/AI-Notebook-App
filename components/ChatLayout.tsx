"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  onEnsureThread?: () => Promise<string | null>;
  onThreadUpdated?: () => void | Promise<void>;
};

export default function ChatLayout({
  activeThreadId,
  selectedSources = [],
  onEnsureThread,
  onThreadUpdated,
}: ChatLayoutProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [streamStatus, setStreamStatus] = useState<
    "idle" | "thinking" | "streaming" | "error"
  >("idle");
  const streamingActive = streamStatus !== "idle";
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const loadOlderRef = useRef<() => void>(() => {});
  const stickToBottomRef = useRef(true);
  const syncedMessagesSignatureRef = useRef("");
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
  const { data: initialMessagesData } = initialMessagesQuery;

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
    if (!question) return;

    const threadId = activeThreadId || await onEnsureThread?.();

    if (!threadId) {
      setStreamStatus("error");
      return;
    }

    const config = await getAuthorizedRequestConfig();

    if (!config) {
      setStreamStatus("error");
      return;
    }

    stickToBottomRef.current = true;
    setStreamStatus("thinking");

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user" as const,
        content: question,
      },
    ]);

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
        const assistantExists = prev.some((message) => message.id === assistantTempId);

        if (!assistantExists) return prev;

        return prev.map((message) =>
          message.id === assistantTempId
            ? {
                ...message,
                content: fullText,
              }
            : message,
        );
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
      return updated;
    });

    const memory = getMemory();

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        question,
        memory,
        threadId,
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
            const assistantExists = prev.some((message) => message.id === assistantTempId);

            if (!assistantExists) return prev;

            return prev.map((message) =>
              message.id === assistantTempId
                ? {
                    ...message,
                    sources: assistantSources,
                  }
                : message,
            );
          });
        }

        if (event.type === "error") {
          setStreamStatus("error");
        }
      });

      flushPendingText();
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
    onEnsureThread,
    onThreadUpdated,
    selectedSourcesPayload,
  ]);

  const latestMessage = messages.at(-1);
  const hasMessages = messages.some(Boolean);
  const scrollSignal = [
    messages.length,
    latestMessage?.id || "",
    latestMessage?.content.length || 0,
    latestMessage?.sources?.length || 0,
  ].join(":");

  useEffect(() => {
    if (!hasMessages && !streamingActive) return;

    const scrollContainer = scrollRef.current;
    const shouldStick = scrollContainer
      ? scrollContainer.scrollHeight -
          scrollContainer.scrollTop -
          scrollContainer.clientHeight <
        180
      : true;

    if (!streamingActive && !shouldStick && !stickToBottomRef.current) return;

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: streamingActive ? "auto" : "smooth",
      });
    });
  }, [hasMessages, scrollSignal, streamingActive]);

  useEffect(() => {
    if (streamingActive) return;

    if (!activeThreadId) {
      syncedMessagesSignatureRef.current = "";
      setMessages((current) => (current.length > 0 ? [] : current));
      setNextCursor((current) => (current ? null : current));
      return;
    }

    if (!initialMessagesData) return;

    const nextSignature = [
      activeThreadId,
      initialMessagesData.nextCursor || "",
      initialMessagesData.messages.length,
      initialMessagesData.messages[0]?.id || "",
      initialMessagesData.messages.at(-1)?.id || "",
    ].join(":");

    if (syncedMessagesSignatureRef.current === nextSignature) return;

    syncedMessagesSignatureRef.current = nextSignature;
    setMessages(initialMessagesData.messages.map(mapThreadMessage));
    setNextCursor(initialMessagesData.nextCursor);
  }, [activeThreadId, initialMessagesData, mapThreadMessage, streamingActive]);

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
      stickToBottomRef.current =
        element.scrollHeight - element.scrollTop - element.clientHeight < 180;

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
    <div
      ref={scrollRef}
      data-testid="chat-scroll-area"
      className={`flex-1 min-h-0 ${hasMessages ? "overflow-y-auto" : "overflow-hidden"}`}
    >
      {hasMessages ? (
        <>
          <ChatMessages
            messages={messages}
            streamStatus={streamStatus}
            scrollContainerRef={scrollRef}
          />
          <div ref={bottomRef} className="h-1" />
        </>
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {activeThreadId
            ? "Ask a question to start this chat."
            : "Create a chat to start."}
        </div>
      )}
    </div>

    {/* Sticky Input */}
    <div className="shrink-0">
      <ChatInput
        ask={ask}
        loading={streamingActive}
        placeholder={
          activeThreadId
            ? "Ask anything about your sources..."
            : "Ask anything to start a new chat..."
        }
      />
    </div>

  </div>
);
}
