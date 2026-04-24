"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function Sidebar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sources, setSources] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    fileRef.current?.click();
  }

  function onSuccessUpload() {
    window.dispatchEvent(new Event("close-sidebar"));
  }

  async function uploadPDF(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (sources.length >= 5) {
      toast.error("Maximum 5 sources per thread");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const loading = toast.loading("Processing content...");
    onSuccessUpload();

    try {
      await axios.post("/api/upload", formData);

      toast.success("Upload successful 🎉", {
        description: "PDF indexed successfully",
        id: loading,
      });
      await fetchSources();
    } catch (err) {
      toast.error("Upload failed ❌", {
        description: "Something went wrong.",
        id: loading,
      });
    }
  }

  async function addURL() {
    const url = prompt("Enter URL / YouTube link");

    if (!url) return;

    if (sources.length >= 5) {
      toast.error("Maximum 5 sources per thread");
      return;
    }

    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");

    const endpoint = isYoutube ? "/api/youtube" : "/api/url";

    const loading = toast.loading("Processing content...");
    onSuccessUpload();

    try {
      await axios.post(endpoint, { url });

      toast.success("Upload successful 🎉", {
        description: isYoutube
          ? "YouTube video indexed successfully"
          : "Article indexed successfully",
        id: loading,
      });

      await fetchSources();
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
    onSuccessUpload();

    try {
      await axios.post("/api/text", { text });

      toast.success("Upload successful 🎉", {
        description: "Text indexed successfully",
        id: loading,
      });

      await fetchSources();
    } catch (err) {
      toast.error("Upload failed ❌", {
        description: "Something went wrong.",
        id: loading,
      });
    }
  }

  const fetchSources = async () => {
    const res = await fetch("/api/sources");
    const data = await res.json();
    setSources(data);
  };

  useEffect(() => {
    const load = async () => {
      await fetchSources();
    };

    load();
  }, []);

  return (
    <div className="w-full md:w-[300px] h-full bg-[#111111] flex flex-col justify-between px-5 py-5 border-r border-white/5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Notebook
        </h1>

        <p className="text-sm text-zinc-400 mt-1 uppercase tracking-[0.18em]">
          Chat with your sources
        </p>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          {sources.length === 0 ? (
            <p className="text-zinc-400 text-center leading-7 text-sm">
              Add sources below to build your research workspace
            </p>
          ) : (
            sources.map((s, i) => {
              const isPDF = s?.source === "pdf";

              return (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-muted hover:bg-muted/70"
                >
                  <span>{isPDF ? "📄" : "🎥"}</span>
                  <span className="truncate">
                    {s?.name || s?.url || "Untitled"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="space-y-4">
        <Separator className="bg-[#1a1a1a] border-t border-border" />

        <div className="space-y-3 flex flex-col">
          <input
            type="file"
            accept="application/pdf"
            ref={fileRef}
            className="hidden"
            onChange={uploadPDF}
          />
          <Button
            variant="outline"
            className="
              h-12 rounded-2xl
              bg-[#151515]
              border border-white/10
              hover:bg-[#1d1d1d]
              transition-all
              active:scale-[0.98]
            "
            onClick={handleClick}
          >
            📄 Add PDF
          </Button>

          <Button
            variant="outline"
            className="
              h-12 rounded-2xl
              bg-[#151515]
              border border-white/10
              hover:bg-[#1d1d1d]
              transition-all
              active:scale-[0.98]
            "
            onClick={addURL}
          >
            🔗 Add URL / YouTube
          </Button>

          <Button
            variant="outline"
            className="
              h-12 rounded-2xl
              bg-[#151515]
              border border-white/10
              hover:bg-[#1d1d1d]
              transition-all
              active:scale-[0.98]
            "
            onClick={pasteText}
          >
            📝 Paste text
          </Button>
        </div>
      </div>
    </div>
  );
}
