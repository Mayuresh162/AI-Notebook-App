import { getSupabaseAdmin } from "@/lib/supabase";
import { requireUser } from "@/lib/supabase-server";
import { jsonError, readJsonObject } from "@/lib/security";
import { consumeThreadCreateRateLimit } from "@/lib/server-controls";
import { enforceSameOriginRequest } from "@/lib/csrf";

const MAX_THREADS_PER_USER = 5;

export async function GET() {
  const auth = await requireUser();

  if (auth.error) return auth.error;

  const rate = await consumeThreadCreateRateLimit(auth.user.id);

  if (rate.error) return rate.error;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("threads")
    .select("id, title, created_at, updated_at")
    .eq("user_id", auth.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return jsonError(error.message, 500);
  }

  return Response.json({
    threads: data || [],
  });
}

export async function POST(req: Request) {
  const csrf = await enforceSameOriginRequest();

  if (csrf.error) return csrf.error;

  const auth = await requireUser();

  if (auth.error) return auth.error;

  const supabase = getSupabaseAdmin();

  const { count, error: countError } = await supabase
    .from("threads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id);

  if (countError) {
    return jsonError(countError.message, 500);
  }

  if ((count || 0) >= MAX_THREADS_PER_USER) {
    return jsonError("Maximum 5 chats allowed", 400);
  }

  const body = await readJsonObject(req);
  const title =
    body.data && typeof body.data.title === "string" && body.data.title.trim()
      ? body.data.title.trim().slice(0, 120)
      : "New chat";

  const { data, error } = await supabase
    .from("threads")
    .insert({
      user_id: auth.user.id,
      title,
    })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return Response.json({
    thread: data,
  });
}
