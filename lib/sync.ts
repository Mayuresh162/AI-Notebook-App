import { getSupabase } from "./supabase";
import { syncNotionForUser } from "./sync/notion";
import { syncGoogleForUser } from "./sync/google";
import { decryptToken } from "./token-encryption";

type Integration = {
  id: string;
  user_id: string;
  provider: "notion" | "google";
  access_token: string;
};

export async function runUserSync(
  userId: string,
  provider: "notion" | "google"
) {
  const supabase = getSupabase();

  await supabase
    .from("integrations")
    .update({
      sync_status: "running",
      last_error: null,
    })
    .eq("user_id", userId)
    .eq("provider", provider);

  try {
    const { data: integration } = await supabase
      .from("integrations")
      .select("id, user_id, provider, access_token")
      .eq("user_id", userId)
      .eq("provider", provider)
      .single<Integration>();

    if (!integration) {
      throw new Error("Integration not found");
    }

    if (provider === "notion") {
      await syncNotionForUser({
        ...integration,
        access_token: decryptToken(integration.access_token),
      });
    } else {
      await syncGoogleForUser({
        ...integration,
        access_token: decryptToken(integration.access_token),
      });
    }

    await supabase
      .from("integrations")
      .update({
        sync_status: "idle",
        last_synced_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", provider);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sync error";

    await supabase
      .from("integrations")
      .update({
        sync_status: "error",
        last_error: message,
      })
      .eq("user_id", userId)
      .eq("provider", provider);
  }
}
