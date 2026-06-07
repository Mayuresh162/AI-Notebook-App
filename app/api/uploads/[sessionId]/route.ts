import { requireUser } from "@/lib/supabase-server";
import { jsonError } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireUser();

  if (auth.error) return auth.error;

  const { sessionId } = await context.params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("source_upload_sessions")
    .select(
      "id, filename, size_bytes, part_count, received_parts, status, error, updated_at",
    )
    .eq("id", sessionId)
    .eq("user_id", auth.user.id)
    .single();

  if (error || !data) {
    return jsonError("Upload session not found", 404);
  }

  const { data: job } = await supabase
    .from("source_ingestion_jobs")
    .select("id, status, attempts, max_attempts, error")
    .eq("session_id", sessionId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  return Response.json({
    session: data,
    job,
  });
}
