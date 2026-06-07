"use client";

import type { AuthorizedRequestConfig } from "@/lib/api/auth-client";
import { apiJsonRequest } from "@/lib/api/fetch-client";
import type { SanitizedSource } from "@/lib/security";

export type Thread = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type MessageRole = "user" | "assistant";

export type ThreadMessage = {
  id: string;
  thread_id: string;
  role: MessageRole;
  content: string;
  sources?: SanitizedSource[] | null;
  created_at: string;
};

export type FetchMessagesOptions = {
  limit?: number;
  before?: string | null;
};

export type FetchMessagesResult = {
  messages: ThreadMessage[];
  nextCursor: string | null;
};

export async function fetchThreads(config: AuthorizedRequestConfig) {
  const res = await apiJsonRequest<{ threads: Thread[] }>("/api/threads", config);

  return res.threads;
}

export async function createThread(
  config: AuthorizedRequestConfig,
  title = "New chat",
) {
  const res = await apiJsonRequest<{ thread: Thread }>("/api/threads", config, {
    method: "POST",
    body: { title },
  });

  return res.thread;
}

export async function fetchThreadMessages(
  config: AuthorizedRequestConfig,
  threadId: string,
  options: FetchMessagesOptions = {},
) {
  const params = new URLSearchParams();

  if (options.limit) params.set("limit", String(options.limit));
  if (options.before) params.set("before", options.before);

  const query = params.toString();
  return apiJsonRequest<FetchMessagesResult>(
    `/api/threads/${threadId}/messages${query ? `?${query}` : ""}`,
    config,
  );
}

export async function createThreadMessage(
  config: AuthorizedRequestConfig,
  threadId: string,
  payload: {
    role: MessageRole;
    content: string;
    sources?: SanitizedSource[] | null;
  },
) {
  const res = await apiJsonRequest<{ message: ThreadMessage }>(
    `/api/threads/${threadId}/messages`,
    config,
    {
      method: "POST",
      body: payload,
    },
  );

  return res.message;
}
