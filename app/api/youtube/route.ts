import { loadYoutube } from "@/loaders/youtubeLoader";
import { ingestDocument } from "@/lib/ingest";

export async function POST(req: Request) {
  const { url } = await req.json();

  const result = await loadYoutube(url);

  console.log("Transcript length:", result.text.length);

  const ingestResult = await ingestDocument(result.text, {
    source: "youtube",
    url,
  });

  return Response.json({
    chunks: ingestResult.chunks,
  });
}
