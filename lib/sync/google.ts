import { getEmbedding } from "../embeddings";
import { createClient } from "@supabase/supabase-js";

export async function syncGoogleForUser(integration: any) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?pageSize=10",
    {
      headers: {
        Authorization: `Bearer ${integration.access_token}`,
      },
    }
  );

  const data = await res.json();
  const files = data.files || [];

  for (const file of files) {
    const content = file.name;

    const embedding = await getEmbedding(content);

    await supabase.from("documents").insert({
      user_id: integration.user_id,
      content,
      embedding,
      metadata: {
        source: "google_drive",
        name: file.name,
      },
      env: process.env.NODE_ENV === "development" ? "dev" : "prod",
    });
  }

  await supabase
    .from("integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", integration.id);
}