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
    `${process.env.APP_URL}/api/integrations/google/callback`;
  const state = createOAuthState();

  const url =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(
      "https://www.googleapis.com/auth/drive.readonly"
    )}` +
    `&state=${encodeURIComponent(state)}` +
    `&access_type=offline` +
    `&prompt=consent`;

  const response = NextResponse.redirect(url);

  response.cookies.set("oauth_state_google", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
