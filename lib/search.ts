import { getSupabase } from "./supabase";

export async function searchDocuments(
  embedding: number[],
  userId: string,
  source?: string,
  matchCount = 8,
) {
  const supabase = getSupabase();

  if (!supabase) {
    return Response.json({
      sources: [],
      error: "Supabase not configured",
    });
  }

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: matchCount,
    filter_source: source ?? null,
    filter_user_id: userId,
    filter_env: process.env.NODE_ENV === "development" ? "dev" : "prod",
  });

  if (error) throw error;

  return data;
}
