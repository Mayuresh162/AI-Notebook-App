import { getSupabase } from "@/lib/supabase";
import { requireUser } from "@/lib/supabase-server";
import { getDataEnvironment } from "@/lib/app-env";

type SourceMetadata = Record<string, unknown>;

function safeText(value: unknown, maxLength = 300) {
  if (typeof value !== "string") return undefined;

  return value.trim().slice(0, maxLength);
}

function sanitizeMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return {};

  const source = metadata as SourceMetadata;

  return {
    name: safeText(source.name),
    source: safeText(source.source, 80),
    url: safeText(source.url, 2_048),
    fileType: safeText(source.fileType, 120),
    created_at: safeText(source.created_at, 80),
  };
}

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
    .eq("env", getDataEnvironment())
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Extract unique sources
  const uniqueSources = Array.from(
    new Map(
      data.map((d) => {
        const metadata = sanitizeMetadata(d.metadata);

        return [metadata.name || metadata.url || metadata.source, metadata];
      }),
    ).values(),
  ).filter((metadata) => metadata.name || metadata.url || metadata.source);

  return Response.json(uniqueSources);
}
