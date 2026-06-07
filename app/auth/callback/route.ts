import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

function getSafeRedirect(requestUrl: URL) {
  const next = requestUrl.searchParams.get("next");

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return new URL("/", requestUrl.origin);
  }

  return new URL(next, requestUrl.origin);
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", requestUrl.origin),
    );
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", requestUrl.origin),
    );
  }

  return NextResponse.redirect(getSafeRedirect(requestUrl));
}
