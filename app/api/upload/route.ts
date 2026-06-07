import { loadPDF } from "@/loaders/pdfLoader";
import { requireUser } from "@/lib/supabase-server";
import { jsonError, validateFile } from "@/lib/security";
import { ingestTextForUser } from "@/lib/api/source-ingestion";
import { validateUploadContent } from "@/lib/upload/validate-content";
import { enforceSameOriginRequest } from "@/lib/csrf";
import { consumeSourceIngestRateLimit } from "@/lib/server-controls";

export async function POST(req: Request) {
  try {
    const csrf = await enforceSameOriginRequest();

    if (csrf.error) return csrf.error;

    const auth = await requireUser();

    if (auth.error) return auth.error;

    const rate = await consumeSourceIngestRateLimit(auth.user.id);

    if (rate.error) return rate.error;

    const { user } = auth;
    const formData = await req.formData();
    const fileResult = validateFile(formData.get("file") as File | null, ["pdf"]);

    if (fileResult.error) return fileResult.error;

    const { file } = fileResult;
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!validateUploadContent(buffer, file.name)) {
      return jsonError("File content does not match the expected type", 415);
    }

    const result = await loadPDF(buffer);

    return ingestTextForUser(
      result.text,
      {
        source: "pdf",
        name: file.name,
      },
      user.id,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process PDF";

    return jsonError(message, 500);
  }
}
