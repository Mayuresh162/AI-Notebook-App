import { loadURL } from "@/loaders/urlLoader";
import { ingestDocument } from "@/lib/ingest";
import { requireUser } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const auth = await requireUser();

  if (auth.error) return Response.json({ error: auth.error }, { status: 400 });

  const { user } = auth;
  
  const { url } = await req.json();

  const result = await loadURL(url);

  const ingestResult = await ingestDocument(result.text, {
    source: "url",
    url,
  }, user.id);

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
