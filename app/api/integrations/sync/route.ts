import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncNotionForUser } from "@/lib/sync/notion";
import { syncGoogleForUser } from "@/lib/sync/google";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: integrations } = await admin
    .from("integrations")
    .select("*")
    .eq("user_id", user.id);

  for (const integration of integrations || []) {
    if (integration.provider === "notion") {
       syncNotionForUser(integration);
    }

    if (integration.provider === "google") {
        syncGoogleForUser(integration);
    }
  }

  return NextResponse.json({ success: true });
}