import { getSupabase } from "./supabase";
import { getDataEnvironment } from "./app-env";

export async function searchDocuments(
  embedding: number[],
  userId: string,
  source?: string | string[],
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
    filter_source: Array.isArray(source) ? null : source ?? null,
    filter_sources: Array.isArray(source) && source.length > 0 ? source : null,
    filter_user_id: userId,
    filter_env: getDataEnvironment(),
  });

  if (error) throw error;

  return data;
}
