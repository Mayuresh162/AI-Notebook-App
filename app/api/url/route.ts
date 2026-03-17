import { loadURL } from "@/loaders/urlLoader";
import { ingestDocument } from "@/lib/ingest";

export async function POST(req: Request) {
  const { url } = await req.json();

  const result = await loadURL(url);

  const ingestResult = await ingestDocument(result.text, {
    source: "url",
    url,
  });

  return Response.json({
    chunks: ingestResult.chunks,
  });
}
