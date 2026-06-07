import { syncNotionForUser } from "@/lib/sync/notion";
import { syncGoogleForUser } from "@/lib/sync/google";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: integrations } = await supabase
    .from("integrations")
    .select("*");

  for (const integration of integrations || []) {
    if (integration.provider === "notion") {
       syncNotionForUser(integration);
    }

    if (integration.provider === "google") {
       syncGoogleForUser(integration);
    }
  }

  return new Response("ok");
}
