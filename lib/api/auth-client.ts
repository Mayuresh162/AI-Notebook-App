"use client";

import { getSupabaseClient } from "@/lib/supabase-client";

export type AuthorizedRequestConfig = {
  headers: HeadersInit;
};

export async function getAuthorizedRequestConfig(): Promise<AuthorizedRequestConfig | null> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  return {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  };
}

export async function signOutAndRedirect() {
  const supabase = getSupabaseClient();

  await supabase.auth.signOut();
  location.href = "/login";
}
