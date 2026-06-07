import { NextResponse } from "next/server";

export async function GET() {
  const redirect =
    `${process.env.APP_URL}/api/integrations/notion/callback`;

  const url =
    `https://api.notion.com/v1/oauth/authorize` +
    `?client_id=${process.env.NOTION_CLIENT_ID}` +
    `&response_type=code` +
    `&owner=user` +
    `&redirect_uri=${encodeURIComponent(
      redirect
    )}`;

  return NextResponse.redirect(url);
}