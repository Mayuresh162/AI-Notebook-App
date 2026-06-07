import { getEmbedding } from "../embeddings";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getDataEnvironment } from "@/lib/app-env";

type Integration = {
  id: string;
  user_id: string;
  access_token: string;
};

type NotionPage = {
  id?: string;
};

export async function syncNotionForUser(integration: Integration) {
  const supabase = getSupabaseAdmin();

  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${integration.access_token}`,
      "Notion-Version": "2022-06-28",
    },
  });

  const data = await res.json();
  const pages = Array.isArray(data.results) ? data.results as NotionPage[] : [];

  for (const page of pages) {
    const text = JSON.stringify(page);

    const embedding = await getEmbedding(text);

    await supabase.from("documents").insert({
      user_id: integration.user_id,
      content: text,
      embedding,
      metadata: {
        source: "notion",
        name: page.id || "Untitled Notion page",
      },
      env: getDataEnvironment(),
    });
  }

  await supabase
    .from("integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", integration.id);
}
