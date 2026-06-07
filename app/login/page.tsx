"use client";

import { FormEvent, useMemo, useState } from "react";
import { Github, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/lib/supabase-client";

function getRedirectUrl() {
  if (typeof window === "undefined") return "/auth/callback";

  return `${window.location.origin}/auth/callback`;
}

export default function LoginPage() {
  const t = useTranslations("login");
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"google" | "github" | null>(
    null,
  );

  async function signInWithProvider(provider: "google" | "github") {
    setError("");
    setMessage("");
    setOauthProvider(provider);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectUrl(),
      },
    });

    if (signInError) {
      setError(t("oauthFailed"));
      setOauthProvider(null);
    }
  }

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();

    setError("");
    setMessage("");

    if (!trimmedEmail) {
      setError(t("emailRequired"));
      return;
    }

    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(t("magicFailed"));
      return;
    }

    setMessage(t("magicSent"));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-sm space-y-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-zinc-400">
            {t("subtitle")}
          </p>
        </div>

        <form className="space-y-3" onSubmit={sendMagicLink}>
          <Input
            aria-label={t("emailPlaceholder")}
            autoComplete="email"
            className="h-11 border-white/10 bg-zinc-950 text-white"
            disabled={isSubmitting}
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("emailPlaceholder")}
            type="email"
            value={email}
          />
          <Button
            className="h-11 w-full"
            disabled={isSubmitting || Boolean(oauthProvider)}
            type="submit"
          >
            <Mail className="size-4" />
            {isSubmitting ? t("sending") : t("magicLink")}
          </Button>
        </form>

        <div className="grid gap-2">
          <Button
            className="h-11 w-full bg-white text-black hover:bg-zinc-200"
            disabled={isSubmitting || Boolean(oauthProvider)}
            onClick={() => signInWithProvider("google")}
            type="button"
          >
            {oauthProvider === "google" ? t("redirecting") : t("continueGoogle")}
          </Button>
          <Button
            className="h-11 w-full"
            disabled={isSubmitting || Boolean(oauthProvider)}
            onClick={() => signInWithProvider("github")}
            type="button"
            variant="outline"
          >
            <Github className="size-4" />
            {oauthProvider === "github" ? t("redirecting") : t("continueGithub")}
          </Button>
        </div>

        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </section>
    </main>
  );
}
