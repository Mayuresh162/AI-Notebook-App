import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("documents")
    .select("metadata")
    .limit(50);

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
