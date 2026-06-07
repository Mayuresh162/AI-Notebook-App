import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase-server";
import { getSupabase } from "@/lib/supabase";
import { jsonError } from "@/lib/security";
import { verifyOAuthState } from "@/lib/oauth-state";
import { encryptToken } from "@/lib/token-encryption";

export async function GET(req: Request) {
   const auth = await requireUser();

  if (auth.error) return auth.error;

  const { user } = auth;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "";
  const expectedState = req.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("oauth_state_google="))
    ?.split("=")[1];

  if (!code) {
    return jsonError("Missing authorization code");
  }

  if (!verifyOAuthState(state, expectedState)) {
    return jsonError("Invalid OAuth state", 400);
  }

  const redirect =
    `${process.env.APP_URL}/api/integrations/google/callback`;

  const tokenRes = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code || "",
        client_id:
          process.env.GOOGLE_CLIENT_ID!,
        client_secret:
          process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirect,
        grant_type: "authorization_code",
      }),
    }
  );

  if (!tokenRes.ok) {
    return jsonError("Failed to connect Google Drive", 502);
  }

  const token = await tokenRes.json();

  if (!token.access_token) {
    return jsonError("Failed to connect Google Drive", 502);
  }

  const supabase = getSupabase();

  await supabase
    .from("integrations")
    .upsert({
      user_id: user.id,
      provider: "google",
      access_token: encryptToken(token.access_token),
      refresh_token:
        token.refresh_token ? encryptToken(token.refresh_token) : "",
    });

  const response = NextResponse.redirect(
    `${process.env.APP_URL}/`
  );
  response.cookies.delete("oauth_state_google");

  return response;
}
