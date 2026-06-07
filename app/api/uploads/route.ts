import { requireUser } from "@/lib/supabase-server";
import {
  getRequiredString,
  jsonError,
  readJsonObject,
} from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  getUploadExtension,
  isAllowedUploadMimeType,
  isSupportedUploadExtension,
  MAX_UPLOAD_BYTES,
  UPLOAD_PART_BYTES,
} from "@/lib/upload/constants";
import {
  consumeDailyUploadBytesQuota,
  consumeUploadStartRateLimit,
} from "@/lib/server-controls";
import { enforceSameOriginRequest } from "@/lib/csrf";

export async function POST(req: Request) {
  const csrf = await enforceSameOriginRequest();

  if (csrf.error) return csrf.error;

  const auth = await requireUser();

  if (auth.error) return auth.error;

  const body = await readJsonObject(req);

  if (body.error) return body.error;

  const rate = await consumeUploadStartRateLimit(auth.user.id);

  if (rate.error) return rate.error;

  const filename = getRequiredString(body.data, "filename", 255);

  if (filename.error) return filename.error;

  const sizeBytes = Number(body.data.sizeBytes);
  const mimeType =
    typeof body.data.mimeType === "string"
      ? body.data.mimeType.slice(0, 120)
      : "application/octet-stream";
  const extension = getUploadExtension(filename.value);

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return jsonError("File size is required");
  }

  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return jsonError("File is too large", 413);
  }

  if (!isSupportedUploadExtension(extension)) {
    return jsonError("File type is not supported", 415);
  }

  if (!isAllowedUploadMimeType(extension, mimeType)) {
    return jsonError("File MIME type is not supported", 415);
  }

  const quota = await consumeDailyUploadBytesQuota(auth.user.id, sizeBytes);

  if (quota.error) return quota.error;

  const partCount = Math.ceil(sizeBytes / UPLOAD_PART_BYTES);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("source_upload_sessions")
    .insert({
      user_id: auth.user.id,
      filename: filename.value,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      part_count: partCount,
      received_parts: 0,
      status: "uploading",
    })
    .select("id, filename, size_bytes, part_count, received_parts, status")
    .single();

  if (error || !data) {
    return jsonError(error?.message || "Failed to create upload session", 500);
  }

  return Response.json({
    session: data,
    partSize: UPLOAD_PART_BYTES,
  });
}
