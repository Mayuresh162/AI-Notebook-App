import { getSupabase } from "@/lib/supabase";
import { requireUser } from "@/lib/supabase-server";

export async function GET() {

  const auth = await requireUser();

  if (auth.error) return auth.error;

  const { user } = auth;

  const supabase = getSupabase();

  if (!supabase) {
    return Response.json({
      sources: [],
      error: "Supabase not configured",
    });
  }

  const { data, error } = await supabase
    .from("documents")
    .select("id, metadata")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
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
