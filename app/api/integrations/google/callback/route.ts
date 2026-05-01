import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase-server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
   const auth = await requireUser();

  if (auth.error) return auth.error;

  const { user } = auth;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

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

  const token = await tokenRes.json();

  const supabase = getSupabase();

  await supabase
    .from("integrations")
    .upsert({
      user_id: user.id,
      provider: "google",
      access_token: token.access_token,
      refresh_token:
        token.refresh_token || "",
    });

  return NextResponse.redirect(
    `${process.env.APP_URL}/`
  );
}