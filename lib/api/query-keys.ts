export const queryKeys = {
  threads: ["threads"] as const,
  sources: ["sources"] as const,
  threadMessages: (threadId: string | null) =>
    ["thread-messages", threadId] as const,
};
