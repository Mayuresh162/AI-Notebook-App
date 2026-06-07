import { createHash } from "node:crypto";
import { requireUser } from "@/lib/supabase-server";
import { jsonError } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  UPLOAD_PART_BYTES,
  UPLOAD_STORAGE_BUCKET,
} from "@/lib/upload/constants";
import { enforceSameOriginRequest } from "@/lib/csrf";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

function getPartNumber(req: Request) {
  const headerValue = req.headers.get("x-upload-part-number");
  const partNumber = Number(headerValue);

  if (!Number.isInteger(partNumber) || partNumber < 1) {
    return null;
  }

  return partNumber;
}

export async function POST(req: Request, context: RouteContext) {
  const csrf = await enforceSameOriginRequest();

  if (csrf.error) return csrf.error;

  const auth = await requireUser();

  if (auth.error) return auth.error;

  const { sessionId } = await context.params;
  const partNumber = getPartNumber(req);

  if (!partNumber) {
    return jsonError("Part number is required");
  }

  const supabase = getSupabaseAdmin();
  const { data: session, error: sessionError } = await supabase
    .from("source_upload_sessions")
    .select("id, part_count, size_bytes, status")
    .eq("id", sessionId)
    .eq("user_id", auth.user.id)
    .single();

  if (sessionError || !session) {
    return jsonError("Upload session not found", 404);
  }

  if (session.status !== "uploading") {
    return jsonError("Upload session is not accepting parts", 409);
  }

  if (partNumber > session.part_count) {
    return jsonError("Part number is out of range");
  }

  const buffer = Buffer.from(await req.arrayBuffer());

  if (buffer.length <= 0) {
    return jsonError("Upload part is empty");
  }

  const expectedLastPartBytes =
    session.size_bytes - (session.part_count - 1) * UPLOAD_PART_BYTES;
  const expectedPartBytes =
    partNumber === session.part_count
      ? expectedLastPartBytes
      : UPLOAD_PART_BYTES;

  if (buffer.length !== expectedPartBytes) {
    return jsonError("Upload part size is invalid", 400);
  }

  const checksum = createHash("sha256").update(buffer).digest("hex");
  const storagePath = `${auth.user.id}/${sessionId}/${partNumber}`;
  const { error: uploadError } = await supabase.storage
    .from(UPLOAD_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    return jsonError(uploadError.message, 500);
  }

  const { error: partError } = await supabase.from("source_upload_parts").upsert(
    {
      session_id: sessionId,
      user_id: auth.user.id,
      part_number: partNumber,
      storage_path: storagePath,
      size_bytes: buffer.length,
      checksum,
    },
    {
      onConflict: "session_id,part_number",
    },
  );

  if (partError) {
    return jsonError(partError.message, 500);
  }

  const { count, error: countError } = await supabase
    .from("source_upload_parts")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("user_id", auth.user.id);

  if (countError) {
    return jsonError(countError.message, 500);
  }

  await supabase
    .from("source_upload_sessions")
    .update({
      received_parts: count || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", auth.user.id);

  return Response.json({
    partNumber,
    receivedParts: count || 0,
    partCount: session.part_count,
  });
}
