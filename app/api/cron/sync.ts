import { createClient } from "@supabase/supabase-js";
import { syncNotionForUser } from "@/lib/sync/notion";
import { syncGoogleForUser } from "@/lib/sync/google";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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