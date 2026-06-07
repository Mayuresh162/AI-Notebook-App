"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CircleX, Power } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase-client";

export default function Sidebar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sources, setSources] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabaseClient();

  function handleClick() {
    fileRef.current?.click();
  }

  function onSuccessUpload() {
    window.dispatchEvent(new Event("close-sidebar"));
  }

  async function handleRemoveSource(s: any) {
    const loading = toast.loading("Removing source...");

    try {
      /**
       * Delete only clicked source
       */
      const name = s?.name || s?.url || "Untitled";
      const res = await axios.post("/api/reset", {
        names: [name],
      });

      if (res.data.success) {
        /**
         * Update localStorage
         */
        const existing = JSON.parse(localStorage.getItem("sources") || "[]");

        const updated = existing.filter((item: string) => item !== name);

        localStorage.setItem("sources", JSON.stringify(updated));

        await fetchSources();
      }

      toast.success("Source removed 🎉", { id: loading });
    } catch (err) {
      toast.error("Removal failed ❌", { id: loading });
    }
  }

  async function uploadSource(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();

    const formData = new FormData();
    formData.append("file", file);

    const loading = toast.loading("Processing content...");

    try {
      const endpoint = ext === "pdf" ? "/api/upload" : "/api/filesystem";
      await axios.post(endpoint, formData);

      toast.success("Upload successful 🎉", {
        description: "Source indexed successfully",
        id: loading,
      });
      await fetchSources();
      onSuccessUpload();
    } catch (err) {
      toast.error("Upload failed ❌", {
        description: "Something went wrong.",
        id: loading,
      });
    }
  }

  async function addURL() {
    const url = prompt("Enter link");

    if (!url) return;

    if (sources.length >= 5) {
      toast.error("Maximum 5 sources per thread");
      return;
    }

    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");

    const isGithub = url.includes("github.com");

    const endpoint = isGithub
      ? "/api/github"
      : isYoutube
        ? "/api/youtube"
        : "/api/url";

    const loading = toast.loading("Processing content...");

    try {
      await axios.post(endpoint, { url });

      toast.success("Upload successful 🎉", {
        description: isYoutube
          ? "YouTube video indexed successfully"
          : "Article indexed successfully",
        id: loading,
      });

      await fetchSources();
      onSuccessUpload();
    } catch (err) {
      toast.error("Upload failed ❌", {
        description: "Something went wrong.",
        id: loading,
      });
    }
  }

  async function pasteText() {
    const text = prompt("Paste text");

    if (!text) return;

    if (sources.length >= 5) {
      toast.error("Maximum 5 sources per thread");
      return;
    }

    const loading = toast.loading("Processing content...");

    try {
      await axios.post("/api/text", { text });

      toast.success("Upload successful 🎉", {
        description: "Text indexed successfully",
        id: loading,
      });

      await fetchSources();
      onSuccessUpload();
    } catch (err) {
      toast.error("Upload failed ❌", {
        description: "Something went wrong.",
        id: loading,
      });
    }
  }

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/sources");
      const data = await res.json();

      const safeSources = Array.isArray(data)
        ? data
        : Array.isArray(data.sources)
          ? data.sources
          : [];

      setSources(safeSources);
    } catch (err) {
      console.error(err);
      setSources([]);
    }
  };

  const handleNewChat = () => {
    localStorage.removeItem("chat_messages");
    window.location.reload();
  };

  async function logout() {
    await supabase.auth.signOut();
    location.href = "/login";
  }

  const handleSync = async () => {
    const id = toast.loading("Syncing sources...");

    try {
      setSyncing(true);
      await axios.post("/api/integrations/sync");
      
      toast.success("All sources synced 🎉",{ id });
      setSyncing(false);
      await fetchSources();
    } catch {
      toast.error(
        "Sync failed ❌",
        { id }
      );
    }
  }

  useEffect(() => {
    const load = async () => {
      await fetchSources();
    };

    load();
  }, []);

  return (
  <div className="w-full md:w-[300px] h-full bg-[#111111] flex flex-col border-r border-white/5">
    {/* HEADER */}
    <div className="px-5 pt-5 pb-4 border-b border-white/5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notebook
          </h1>
          <p className="text-xs text-zinc-500 uppercase tracking-[0.18em] mt-1">
            Chat with your sources
          </p>
        </div>

        <Power
          size={18}
          onClick={logout}
          className="cursor-pointer text-zinc-500 hover:text-white transition"
        />
      </div>
    </div>

    {/* BODY */}
    <div className="flex-1 overflow-y-auto px-5 py-5">
      {/* QUICK ACTIONS */}
      <div className="space-y-2">
        <Button
          onClick={handleClick}
          className="w-full h-11 rounded-xl bg-white text-black hover:bg-zinc-200"
        >
          📄 Add Source File
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={addURL}
            className="h-10 rounded-xl bg-[#151515] border-white/10 hover:bg-[#1d1d1d]"
          >
            🔗 URL
          </Button>

          <Button
            variant="outline"
            onClick={pasteText}
            className="h-10 rounded-xl bg-[#151515] border-white/10 hover:bg-[#1d1d1d]"
          >
            📝 Text
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={handleNewChat}
          className="w-full h-10 rounded-xl bg-[#151515] border-white/10 hover:bg-[#1d1d1d]"
        >
          ✨ New Chat
        </Button>
      </div>

      {/* SOURCES */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Sources
          </h2>

          <span className="text-xs text-zinc-600">
            {sources.length}
          </span>
        </div>

        <div className="space-y-2">
          {sources.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[#151515] px-3 py-4 text-sm text-zinc-500">
              No sources added yet.
            </div>
          ) : (
            sources.map((s, i) => {
              const source = s?.source;
              const label =
                s?.name || s?.url || "Untitled";

              const icon =
                source === "pdf" ||
                source === "filesystem"
                  ? "📄"
                  : source === "youtube"
                    ? "🎥"
                    : source === "github"
                      ? "💻"
                      : source === "url"
                        ? "🌐"
                        : source === "text"
                          ? "📝"
                          : "📁";

              return (
                <div
                  key={i}
                  className="group flex items-center gap-2 rounded-xl border border-white/5 bg-[#151515] px-3 py-2"
                >
                  <span>{icon}</span>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">
                      {label}
                    </p>

                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">
                      {source || "source"}
                    </p>
                  </div>

                  <CircleX
                    size={16}
                    onClick={() =>
                      handleRemoveSource(s)
                    }
                    className="cursor-pointer text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-white transition"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* INTEGRATIONS */}
      <div className="mt-7">
        <h2 className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-3">
          Integrations
        </h2>

        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() =>
              (window.location.href =
                "/api/integrations/google/connect")
            }
            className="w-full justify-between h-10 rounded-xl bg-[#151515] border-white/10 hover:bg-[#1d1d1d]"
          >
            <span>Google Drive</span>
            <span>📁</span>
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              (window.location.href =
                "/api/integrations/notion/connect")
            }
            className="w-full justify-between h-10 rounded-xl bg-[#151515] border-white/10 hover:bg-[#1d1d1d]"
          >
            <span>Notion</span>
            <span>📝</span>
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleSync}
              className="h-10 rounded-xl bg-[#151515] border-white/10 hover:bg-[#1d1d1d]"
            >
              🔄 Sync Connected Apps
            </Button>
          </div>
        </div>
      </div>
    </div>

    {/* HIDDEN INPUT */}
    <input
      type="file"
      accept=".pdf,.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx"
      ref={fileRef}
      className="hidden"
      onChange={uploadSource}
    />
  </div>
);
}
