import { getSupabaseAdmin } from "@/lib/supabase";
import { jsonError } from "@/lib/security";

export async function requireOwnedThread(threadId: string, userId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("threads")
    .select("id")
    .eq("id", threadId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return {
      error: jsonError("Thread not found", 404),
    };
  }

  return {
    thread: data,
  };
}
