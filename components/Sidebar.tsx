"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Sidebar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sources, setSources] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    fileRef.current?.click();
  }

  async function uploadPDF(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await axios.post("/api/upload", formData);
  }

  async function addURL() {
    const url = prompt("Enter URL / YouTube link");

    if (!url) return;

    await axios.post("/api/url", { url });
  }

  async function pasteText() {
    const text = prompt("Paste text");

    if (!text) return;

    await axios.post("/api/text", { text });
  }

  useEffect(() => {
    async function fetchSources() {
      const res = await fetch("/api/sources");
      const data = await res.json();
      setSources(data);
    }

    fetchSources();
  }, []);

  return (
    <div className="w-[300px] bg-[#1a1a1a] border-r border-border flex flex-col justify-between p-6 relative">
      <div>
        <h1 className="text-lg font-semibold">Notebook</h1>
        <p className="text-sm text-muted-foreground">CHAT WITH YOUR SOURCES</p>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add sources below to start your research
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

        <div className="space-y-3">
          <input
            type="file"
            accept="application/pdf"
            ref={fileRef}
            className="hidden"
            onChange={uploadPDF}
          />
          <Button
            variant="outline"
            className="w-full justify-start cursor-pointer"
            onClick={handleClick}
          >
            📄 Add PDF
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start cursor-pointer"
            onClick={addURL}
          >
            🔗 Add URL / YouTube
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start cursor-pointer"
            onClick={pasteText}
          >
            📝 Paste text
          </Button>
        </div>
      </div>
    </div>
  );
}
