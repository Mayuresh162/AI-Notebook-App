import { NextResponse } from "next/server";

export async function GET() {
  const redirect =
    `${process.env.APP_URL}/api/integrations/google/callback`;

  const url =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(
      "https://www.googleapis.com/auth/drive.readonly"
    )}` +
    `&access_type=offline` +
    `&prompt=consent`;

  return NextResponse.redirect(url);
}