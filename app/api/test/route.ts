import { loadYoutube } from "@/loaders/youtubeLoader";
import { loadPDF } from "@/loaders/pdfLoader";

export async function GET() {
  const data = await loadYoutube("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

  return Response.json({
    length: data.text.length,
  });
}

export async function POST(req: Request) {
  const formData = await req.formData();

  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.length === 0) {
    return Response.json({ error: "Uploaded file is empty" }, { status: 400 });
  }

  console.log("file size:", buffer.length);

  const result = await loadPDF(buffer);

  return Response.json({
    length: result.text.length,
  });
}
