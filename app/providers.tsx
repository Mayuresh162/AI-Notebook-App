"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = getSupabaseClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return children;
}