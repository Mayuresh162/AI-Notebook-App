import { loadPDF } from "@/loaders/pdfLoader";
import { ingestDocument } from "@/lib/ingest";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await loadPDF(buffer);

  const ingestResult = await ingestDocument(result.text, {
    source: "pdf",
    name: file.name,
  });

  return Response.json({
    chunks: ingestResult.chunks,
  });
}
