import { loadURL } from "@/loaders/urlLoader";
import { ingestDocument } from "@/lib/ingest";

export async function POST(req: Request) {
  const { url } = await req.json();

  const result = await loadURL(url);

  const ingestResult = await ingestDocument(result.text, {
    source: "url",
    url,
  });

  let finalChunks;

  if (ingestResult instanceof Response) {
    const data = await ingestResult.json();
    finalChunks = data.chunks;
  } else {
    finalChunks = ingestResult.chunks;
  }

  return Response.json({
    chunks: finalChunks,
  });
}
