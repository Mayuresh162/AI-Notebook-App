"use client";

import { useState } from "react";
import axios from "axios";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SourcesPanel({ triggerRefresh }: any) {
  const [youtube, setYoutube] = useState("");
  const [url, setUrl] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function uploadPDF(e: any) {
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    await axios.post("/api/upload", formData);

    alert("PDF uploaded!");
    triggerRefresh();
  }

  async function addYoutube() {
    await axios.post("/api/youtube", { url: youtube });

    alert("YouTube ingested!");
    setYoutube("");
    triggerRefresh();
  }

  async function addURL() {
    await axios.post("/api/url", { url });

    alert("URL ingested!");
    setUrl("");
    triggerRefresh();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Sources</h2>

      <div>
        <p className="font-medium">Upload PDF</p>
        <input type="file" onChange={uploadPDF} />
      </div>

      <div>
        <p className="font-medium">Add YouTube</p>
        <input
          className="border p-2 w-full"
          value={youtube}
          onChange={(e) => setYoutube(e.target.value)}
        />
        <button
          onClick={addYoutube}
          className="mt-2 bg-black text-white px-3 py-1"
        >
          Add
        </button>
      </div>

      <div>
        <p className="font-medium">Add URL</p>
        <input
          className="border p-2 w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={addURL} className="mt-2 bg-black text-white px-3 py-1">
          Add
        </button>
      </div>
    </div>
  );
}
