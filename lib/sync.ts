import { getSupabase } from "./supabase";
import { syncNotionForUser } from "./sync/notion";
import { syncGoogleForUser } from "./sync/google";

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
    if (provider === "notion") {
        syncNotionForUser(userId);
    } else {
       syncGoogleForUser(userId);
    }

    await supabase
      .from("integrations")
      .update({
        sync_status: "idle",
        last_synced_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", provider);
  } catch (err: any) {
    await supabase
      .from("integrations")
      .update({
        sync_status: "error",
        last_error: err.message,
      })
      .eq("user_id", userId)
      .eq("provider", provider);
  }
}