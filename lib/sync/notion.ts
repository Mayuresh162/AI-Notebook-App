import { getEmbedding } from "../embeddings";
import { createClient } from "@supabase/supabase-js";

export async function syncNotionForUser(integration: any) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${integration.access_token}`,
      "Notion-Version": "2022-06-28",
    },
  });

  const data = await res.json();
  const pages = data.results || [];

  for (const page of pages) {
    const text = JSON.stringify(page);

    const embedding = await getEmbedding(text);

    await supabase.from("documents").insert({
      user_id: integration.user_id,
      content: text,
      embedding,
      metadata: {
        source: "notion",
        name: page.id,
      },
      env: process.env.NODE_ENV === "development" ? "dev" : "prod",
    });
  }

  await supabase
    .from("integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", integration.id);
}