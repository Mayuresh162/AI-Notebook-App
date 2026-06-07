import { loadPDF } from "@/loaders/pdfLoader";
import { ingestDocument } from "@/lib/ingest";
import { requireUser } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

 const auth = await requireUser();

  if (auth.error) return Response.json({ error: auth.error }, { status: 400 });

  const { user } = auth;

  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await loadPDF(buffer);

  const ingestResult = await ingestDocument(result.text, {
    source: "pdf",
    name: file.name
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
