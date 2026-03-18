import { loadPDF } from "@/loaders/pdfLoader";
import { ingestDocument } from "@/lib/ingest";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await loadPDF(buffer);

  const ingestResult = await ingestDocument(result.text, {
    source: "pdf",
    name: file.name,
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
