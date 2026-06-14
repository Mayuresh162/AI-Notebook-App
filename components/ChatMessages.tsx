"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import type { SanitizedSource } from "@/lib/security";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: SanitizedSource[];
};

const ESTIMATED_MESSAGE_HEIGHT = 140;
const OVERSCAN = 8;

function getVisibleRange(
  count: number,
  scrollTop: number,
  viewportHeight: number,
  heights: Map<string, number>,
  keys: string[],
) {
  let start = 0;
  let offset = 0;

  while (start < count) {
    const height = heights.get(keys[start]) || ESTIMATED_MESSAGE_HEIGHT;

    if (offset + height >= scrollTop) break;

    offset += height;
    start += 1;
  }

  let end = start;
  let visibleHeight = 0;

  while (end < count && visibleHeight < viewportHeight) {
    visibleHeight += heights.get(keys[end]) || ESTIMATED_MESSAGE_HEIGHT;
    end += 1;
  }

  return {
    start: Math.max(0, start - OVERSCAN),
    end: Math.min(count, end + OVERSCAN),
  };
}

function getSpacerHeight(
  from: number,
  to: number,
  heights: Map<string, number>,
  keys: string[],
) {
  let total = 0;

  for (let index = from; index < to; index += 1) {
    total += heights.get(keys[index]) || ESTIMATED_MESSAGE_HEIGHT;
  }

  return total;
}

function ChatMessagesComponent({
  messages,
  streamStatus,
  scrollContainerRef,
}: {
  messages: Message[];
  streamStatus?: "idle" | "thinking" | "streaming" | "error";
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const t = useTranslations("chat");
  const rowHeights = useRef(new Map<string, number>());
  const frameRef = useRef<number | null>(null);
  const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [viewport, setViewport] = useState({
    scrollTop: 0,
    height: 0,
  });
  const safeMessages = useMemo(
    () => messages.filter((message): message is Message => Boolean(message)),
    [messages],
  );

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) return;

    const element = scrollContainer;

    function updateViewport() {
      if (frameRef.current !== null) return;

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;

        setViewport({
          scrollTop: element.scrollTop,
          height: element.clientHeight,
        });
      });
    }

    updateViewport();
    element.addEventListener("scroll", updateViewport, {
      passive: true,
    });
    window.addEventListener("resize", updateViewport);

    return () => {
      element.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [scrollContainerRef]);

  const messageKeys = useMemo(
    () => safeMessages.map((message, index) => message.id || `message-${index}`),
    [safeMessages],
  );

  const setRowRef = useCallback(
    (messageKey: string) => (node: HTMLDivElement | null) => {
      if (!node) return;

      const measure = () => {
        const height = node.offsetHeight;

        if (height && rowHeights.current.get(messageKey) !== height) {
          rowHeights.current.set(messageKey, height);
          setMeasuredHeights(new Map(rowHeights.current));
        }
      };

      measure();

      const observer = new ResizeObserver(measure);
      observer.observe(node);

      return () => observer.disconnect();
    },
    [],
  );

  const visibleRange = useMemo(
    () =>
      getVisibleRange(
        safeMessages.length,
        viewport.scrollTop,
        viewport.height,
        measuredHeights,
        messageKeys,
      ),
    [measuredHeights, messageKeys, safeMessages.length, viewport],
  );

  const visibleMessages = safeMessages.slice(visibleRange.start, visibleRange.end);
  const topSpacer = getSpacerHeight(
    0,
    visibleRange.start,
    measuredHeights,
    messageKeys,
  );
  const bottomSpacer = getSpacerHeight(
    visibleRange.end,
    safeMessages.length,
    measuredHeights,
    messageKeys,
  );

  return (
    <div className="max-w-3xl mx-auto px-3 pt-4 pb-32 md:p-6 md:pb-8">
      <div style={{ height: topSpacer }} />

      {visibleMessages.map((m, visibleIndex) => {
        const i = visibleRange.start + visibleIndex;
        const isUser = m.role === "user";
        const isLast = i === safeMessages.length - 1;

        return (
          <div
            key={m.id || i}
            ref={setRowRef(messageKeys[i])}
            className={`flex pb-5 ${isUser ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`
                px-4 py-3 md:px-5 md:py-4
                max-w-[88%] md:max-w-[80%]
                text-[15px] leading-7
                rounded-3xl border shadow-sm
                transition-all duration-200

                ${
                  isUser
                    ? "ml-auto bg-primary text-primary-foreground border-transparent"
                    : "bg-muted text-foreground border-transparent"
                }
              `}
            >
              <div className="whitespace-pre-wrap break-words">
                {m.content ||
                  (!isUser && isLast && streamStatus === "thinking"
                    ? t("thinking")
                    : "")}

                {!isUser && m.sources && m.sources?.length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {m.sources.map((_, i) => `[${i + 1}]`).join(" ")}
                  </span>
                )}

                {/* Streaming cursor */}
                {!isUser && isLast && streamStatus === "streaming" && (
                  <span className="animate-pulse ml-1">▍</span>
                )}

                {!isUser && isLast && streamStatus === "error" && (
                  <span className="ml-1 text-xs text-red-400">
                    {t("streamInterrupted")}
                  </span>
                )}
              </div>

              {!isUser && m.sources && m.sources?.length > 0 && (
                <div className="mt-4 pt-3 border-t text-xs text-muted-foreground space-y-2">
                  {m.sources.map(
                    (s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-xl bg-card px-2 py-1"
                      >
                        <span>[{i + 1}]</span>
                        <span className="truncate">
                          {s.metadata?.name || s.metadata?.url || t("source")}
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

      <div style={{ height: bottomSpacer }} />
    </div>
  );
}

export default memo(ChatMessagesComponent);
