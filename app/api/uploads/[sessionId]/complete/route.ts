import { requireUser } from "@/lib/supabase-server";
import { jsonError } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase";
import { enqueueIngestionJob } from "@/lib/upload/ingestion-jobs";
import { enforceSameOriginRequest } from "@/lib/csrf";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function POST(_req: Request, context: RouteContext) {
  const csrf = await enforceSameOriginRequest();

  if (csrf.error) return csrf.error;

  const auth = await requireUser();

  if (auth.error) return auth.error;

  const { sessionId } = await context.params;
  const supabase = getSupabaseAdmin();
  const { data: session, error: sessionError } = await supabase
    .from("source_upload_sessions")
    .select("id, part_count, received_parts, status")
    .eq("id", sessionId)
    .eq("user_id", auth.user.id)
    .single();

  if (sessionError || !session) {
    return jsonError("Upload session not found", 404);
  }

  if (session.status !== "uploading") {
    return jsonError("Upload session is already completed", 409);
  }

  if (session.received_parts !== session.part_count) {
    return jsonError("Upload is missing parts", 409);
  }

  try {
    const job = await enqueueIngestionJob(sessionId, auth.user.id);

    return Response.json({
      success: true,
      sessionId,
      jobId: job.id,
      status: "queued",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to queue ingestion";

    return jsonError(message, 500);
  }
}
