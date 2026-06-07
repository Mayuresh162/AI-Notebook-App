import { NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase-server";
import { jsonError, validateFile } from "@/lib/security";
import { ingestTextForUser } from "@/lib/api/source-ingestion";
import { loadZip } from "@/loaders/zipLoader";
import { validateUploadContent } from "@/lib/upload/validate-content";
import { enforceSameOriginRequest } from "@/lib/csrf";
import { consumeSourceIngestRateLimit } from "@/lib/server-controls";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const csrf = await enforceSameOriginRequest();

    if (csrf.error) return csrf.error;

    const auth = await requireUser();

    if (auth.error) return auth.error;

    const rate = await consumeSourceIngestRateLimit(auth.user.id);

    if (rate.error) return rate.error;

    const { user } = auth;
    const formData = await req.formData();
    const fileResult = validateFile(
      formData.get("file") as File | null,
      ["txt", "md", "csv", "json", "js", "ts", "jsx", "tsx", "zip"],
    );

    if (fileResult.error) return fileResult.error;

    const { file } = fileResult;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!validateUploadContent(buffer, file.name)) {
      return jsonError("File content does not match the expected type", 415);
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    const zipResult =
      extension === "zip"
        ? await loadZip(buffer)
        : null;
    const text = zipResult?.text || buffer.toString("utf8");

    await ingestTextForUser(
      text,
      {
        name: file.name,
        source: zipResult?.source || "filesystem",
        fileType: file.type,
        created_at: new Date().toISOString(),
      },
      user.id,
    );

    return Response.json({
      success: true,
      name: file.name,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process file";

    return jsonError(message, 500);
  }
}
