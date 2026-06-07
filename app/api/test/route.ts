import { loadYoutube } from "@/loaders/youtubeLoader";
import { loadPDF } from "@/loaders/pdfLoader";
import { requireUser } from "@/lib/supabase-server";
import { validateFile } from "@/lib/security";
import { enforceSameOriginRequest } from "@/lib/csrf";

function requireDevelopmentRoute() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return null;
}

export async function GET() {
  const devOnly = requireDevelopmentRoute();

  if (devOnly) return devOnly;

  const auth = await requireUser();

  if (auth.error) return auth.error;

  const data = await loadYoutube("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

  return Response.json({
    length: data.text.length,
  });
}

export async function POST(req: Request) {
  const devOnly = requireDevelopmentRoute();

  if (devOnly) return devOnly;

  const csrf = await enforceSameOriginRequest();

  if (csrf.error) return csrf.error;

  const auth = await requireUser();

  if (auth.error) return auth.error;

  const formData = await req.formData();
  const fileResult = validateFile(formData.get("file") as File | null, ["pdf"]);

  if (fileResult.error) return fileResult.error;

  const { file } = fileResult;
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await loadPDF(buffer);

  return Response.json({
    length: result.text.length,
  });
}
