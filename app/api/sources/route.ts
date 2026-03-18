import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    return Response.json({
      sources: [],
      error: "Supabase not configured",
    });
  }

  const { data, error } = await supabase
    .from("documents")
    .select("metadata")
    .limit(100);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Extract unique sources
  const uniqueSources = Array.from(
    new Map(
      data.map((d) => [d.metadata?.name || d.metadata?.source, d.metadata]),
    ).values(),
  );

  return Response.json(uniqueSources);
}
