import { getSupabaseAdmin } from "@/lib/supabase";
import type { SanitizedSource } from "@/lib/security";

type CreateChatMessageInput = {
  threadId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  sources?: SanitizedSource[] | null;
};

export async function createChatMessage({
  threadId,
  userId,
  role,
  content,
  sources = null,
}: CreateChatMessageInput) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      user_id: userId,
      role,
      content,
      sources,
    })
    .select("id, thread_id, role, content, sources, created_at")
    .single();

  if (error) {
    throw new Error(`Message insert failed: ${error.message}`);
  }

  await touchThread(threadId, userId);

  return data;
}

export async function touchThread(threadId: string, userId: string) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("threads")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Thread update failed: ${error.message}`);
  }
}

function buildThreadTitle(question: string) {
  const title = question.replace(/\s+/g, " ").trim();

  if (title.length <= 60) return title;

  return `${title.slice(0, 57)}...`;
}

export async function titleThreadFromQuestion(
  threadId: string,
  userId: string,
  question: string,
) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("threads")
    .select("title")
    .eq("id", threadId)
    .eq("user_id", userId)
    .single();

  if (error || !data || data.title !== "New chat") {
    return;
  }

  const { error: updateError } = await supabase
    .from("threads")
    .update({
      title: buildThreadTitle(question),
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`Thread title update failed: ${updateError.message}`);
  }
}
