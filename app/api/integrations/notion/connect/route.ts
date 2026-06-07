import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase-server";
import {
  createOAuthState,
  OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/lib/oauth-state";

export async function GET() {
  const auth = await requireUser();

  if (auth.error) return auth.error;

  const redirect =
    `${process.env.APP_URL}/api/integrations/notion/callback`;
  const state = createOAuthState();

  const url =
    `https://api.notion.com/v1/oauth/authorize` +
    `?client_id=${process.env.NOTION_CLIENT_ID}` +
    `&response_type=code` +
    `&owner=user` +
    `&state=${encodeURIComponent(state)}` +
    `&redirect_uri=${encodeURIComponent(
      redirect
    )}`;

  const response = NextResponse.redirect(url);

  response.cookies.set("oauth_state_notion", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
