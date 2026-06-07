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
    .find((cookie) => cookie.startsWith("oauth_state_notion="))
    ?.split("=")[1];

  if (!code) {
    return jsonError("Missing authorization code");
  }

  if (!verifyOAuthState(state, expectedState)) {
    return jsonError("Invalid OAuth state", 400);
  }

  const redirect = `${process.env.APP_URL}/api/integrations/notion/callback`;

  const basic = Buffer.from(
    `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`,
  ).toString("base64");

  const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirect,
    }),
  });

  if (!tokenRes.ok) {
    return jsonError("Failed to connect Notion", 502);
  }

  const token = await tokenRes.json();

  if (!token.access_token) {
    return jsonError("Failed to connect Notion", 502);
  }

  const supabase = getSupabase();

  await supabase.from("integrations").upsert({
    user_id: user.id,
    provider: "notion",
    access_token: encryptToken(token.access_token),
  });

  const response = NextResponse.redirect(`${process.env.APP_URL}/`);
  response.cookies.delete("oauth_state_notion");

  return response;
}
