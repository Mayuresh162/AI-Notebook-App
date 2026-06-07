import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function getServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) =>
              cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function requireUser() {
  const supabase = await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { user };
  }

  const headersList = await headers();
  const token = headersList.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (token) {
    const {
      data: { user: bearerUser },
    } = await supabase.auth.getUser(token);

    if (bearerUser) {
      return { user: bearerUser };
    }
  }

  return {
    error: Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    ),
  };
}
