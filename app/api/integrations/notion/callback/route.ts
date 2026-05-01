import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase-server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const auth = await requireUser();

  if (auth.error) return auth.error;

  const { user } = auth;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

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

  const token = await tokenRes.json();

  const supabase = getSupabase();

  await supabase.from("integrations").upsert({
    user_id: user.id,
    provider: "notion",
    access_token: token.access_token,
  });

  return NextResponse.redirect(`${process.env.APP_URL}/`);
}
