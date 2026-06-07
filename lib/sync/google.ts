import { getEmbedding } from "../embeddings";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getDataEnvironment } from "@/lib/app-env";

type Integration = {
  id: string;
  user_id: string;
  access_token: string;
};

type GoogleDriveFile = {
  name?: string;
};

export async function syncGoogleForUser(integration: Integration) {
  const supabase = getSupabaseAdmin();

  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?pageSize=10",
    {
      headers: {
        Authorization: `Bearer ${integration.access_token}`,
      },
    }
  );

  const data = await res.json();
  const files = Array.isArray(data.files) ? data.files as GoogleDriveFile[] : [];

  for (const file of files) {
    const content = file.name || "Untitled Google Drive file";

    const embedding = await getEmbedding(content);

    await supabase.from("documents").insert({
      user_id: integration.user_id,
      content,
      embedding,
      metadata: {
        source: "google_drive",
        name: file.name,
      },
      env: getDataEnvironment(),
    });
  }

  await supabase
    .from("integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", integration.id);
}
