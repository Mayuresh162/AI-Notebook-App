"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AUTH EVENT:", event);

        if (session) {
          router.replace("/");
        }
      }
    );

    const init = async () => {
      await supabase.auth.getSession();

      setTimeout(async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          router.replace("/");
        } else {
          router.replace("/login");
        }
      }, 1000);
    };

    init();

    return () => subscription.unsubscribe();
  }, [router]);

  return <div className="p-8 text-white">Signing in...</div>;
}