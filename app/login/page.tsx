"use client";

import { getSupabaseClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const supabase = getSupabaseClient();

  async function signInGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });
  }

  async function signInMagic() {
    const email = prompt("Enter email");

    if (!email) return;

    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    alert("Magic link sent.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6">
      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={signInGoogle}
          className="w-full h-12 rounded-2xl bg-white text-black cursor-pointer"
        >
          Continue with Google
        </button>

        <button
          onClick={signInMagic}
          className="w-full h-12 rounded-2xl bg-zinc-900 border border-white/10 cursor-pointer"
        >
          Magic Link
        </button>
      </div>
    </div>
  );
}