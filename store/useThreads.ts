import { create } from "zustand";

export const useThreads = create((set) => ({
  threads: [],
  activeThreadId: null,

  createThread: () =>
    set((state:any) => ({
      threads: [
        {
          id: crypto.randomUUID(),
          title: "New Thread",
          messages: [],
          sources: [],
        },
        ...state.threads,
      ],
    })),
}));