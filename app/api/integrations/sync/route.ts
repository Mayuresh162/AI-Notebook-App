import { NextResponse } from "next/server";
import { syncNotionForUser } from "@/lib/sync/notion";
import { syncGoogleForUser } from "@/lib/sync/google";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { jsonError } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase";
import { decryptToken } from "@/lib/token-encryption";
import { enforceSameOriginRequest } from "@/lib/csrf";
import { consumeIntegrationSyncRateLimit } from "@/lib/server-controls";

export async function POST() {
  const csrf = await enforceSameOriginRequest();

  if (csrf.error) return csrf.error;

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

  if (!user) return jsonError("Unauthorized", 401);

  const rate = await consumeIntegrationSyncRateLimit(user.id);

  if (rate.error) return rate.error;

  const admin = getSupabaseAdmin();

  const { data: integrations } = await admin
    .from("integrations")
    .select("*")
    .eq("user_id", user.id);

  for (const integration of integrations || []) {
    const decryptedIntegration = {
      ...integration,
      access_token: decryptToken(integration.access_token),
    };

    if (integration.provider === "notion") {
      await syncNotionForUser(decryptedIntegration);
    }

    if (integration.provider === "google") {
      await syncGoogleForUser(decryptedIntegration);
    }
  }

  return NextResponse.json({ success: true });
}
