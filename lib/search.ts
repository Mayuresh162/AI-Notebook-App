import { getSupabase } from "./supabase";

export async function searchDocuments(
  embedding: number[],
  source?: string,
  matchCount = 5,
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
  });

  if (error) throw error;

  return data;
}
