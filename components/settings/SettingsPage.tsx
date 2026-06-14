"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Cloud,
  Monitor,
  Moon,
  Plug,
  RefreshCw,
  Save,
  LogOut,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAuthorizedRequestConfig,
  signOutAndRedirect,
} from "@/lib/api/auth-client";
import {
  connectGoogleDrive,
  connectNotion,
  syncConnectedSources,
} from "@/lib/api/source-client";
import { getSupabaseClient } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";

type ProfileState = {
  email: string;
  fullName: string;
};

function themeOptionClass(selected: boolean) {
  return cn(
    "h-11 justify-start gap-2 rounded-xl border",
    selected
      ? "border-primary bg-muted text-foreground ring-1 ring-primary/20"
      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<ProfileState>({
    email: "",
    fullName: "",
  });
  const [fullName, setFullName] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const profileChanged = fullName.trim() !== profile.fullName.trim();

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      const nextFullName =
        typeof user?.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : typeof user?.user_metadata?.name === "string"
            ? user.user_metadata.name
            : "";

      setProfile({
        email: user?.email || "",
        fullName: nextFullName,
      });
      setFullName(nextFullName);
      setLoadingProfile(false);
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [router, supabase.auth]);

  const saveProfile = useCallback(async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const formFullName = event
      ? new FormData(event.currentTarget).get("fullName")
      : null;
    const nextFullName =
      typeof formFullName === "string" ? formFullName.trim() : fullName.trim();
    const loading = toast.loading("Saving profile...");

    try {
      setSavingProfile(true);
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: nextFullName,
        },
      });

      if (error) {
        throw error;
      }

      setProfile((current) => ({
        ...current,
        fullName: nextFullName,
      }));
      setFullName(nextFullName);
      toast.success("Profile updated", { id: loading });
    } catch {
      toast.error("Unable to update profile", { id: loading });
    } finally {
      setSavingProfile(false);
    }
  }, [fullName, supabase.auth]);

  const syncIntegrations = useCallback(async () => {
    const loading = toast.loading("Syncing connected apps...");

    try {
      setSyncing(true);
      const config = await getAuthorizedRequestConfig();

      if (!config) {
        toast.error("Please sign in again.", { id: loading });
        return;
      }

      await syncConnectedSources(config);
      toast.success("Connected apps synced", { id: loading });
    } catch {
      toast.error("Unable to sync connected apps", { id: loading });
    } finally {
      setSyncing(false);
    }
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-5 sm:px-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft size={16} />
              Back to notebook
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your profile, appearance, and connected apps.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={signOutAndRedirect}
            className="hidden h-9 shrink-0 gap-2 sm:inline-flex"
          >
            <LogOut size={16} />
            Sign out
          </Button>
        </header>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid h-10 w-full grid-cols-3 bg-muted text-muted-foreground">
            <TabsTrigger value="profile" className="h-8 gap-2">
              <User size={15} />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="h-8 gap-2">
              <Moon size={15} />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="integrations" className="h-8 gap-2">
              <Plug size={15} />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-base font-medium">Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Update the name shown for your account.
              </p>

              <form
                aria-label="Profile settings"
                className="mt-5 grid gap-4"
                onSubmit={saveProfile}
              >
                <label className="grid gap-2 text-sm font-medium">
                  Email
                  <Input
                    value={profile.email}
                    disabled
                    aria-label="Email address"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium">
                  Display name
                  <Input
                    name="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your name"
                    aria-label="Display name"
                    disabled={loadingProfile}
                  />
                </label>

                <div>
                  <Button
                    type="submit"
                    disabled={loadingProfile || savingProfile || !profileChanged}
                    className="h-9 gap-2"
                  >
                    <Save size={16} />
                    {savingProfile ? "Saving..." : "Save profile"}
                  </Button>
                </div>
              </form>
            </section>
          </TabsContent>

          <TabsContent value="appearance" className="mt-4">
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-base font-medium">Appearance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose how AI Notebook looks on this device.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTheme("dark")}
                  className={themeOptionClass(theme === "dark")}
                >
                  <Moon size={16} />
                  Dark
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTheme("light")}
                  className={themeOptionClass(theme === "light")}
                >
                  <Sun size={16} />
                  Light
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTheme("system")}
                  className={themeOptionClass(theme === "system")}
                >
                  <Monitor size={16} />
                  System
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="integrations" className="mt-4">
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-base font-medium">Integrations</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect external sources and sync their indexed content.
              </p>

              <div className="mt-5 grid gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={connectGoogleDrive}
                  className="h-11 justify-between"
                >
                  <span className="inline-flex items-center gap-2">
                    <Cloud size={16} />
                    Google Drive
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={connectNotion}
                  className="h-11 justify-between"
                >
                  <span className="inline-flex items-center gap-2">
                    <Plug size={16} />
                    Notion
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={syncIntegrations}
                  disabled={syncing}
                  className="h-11 justify-between"
                >
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw
                      size={16}
                      className={syncing ? "animate-spin" : undefined}
                    />
                    {syncing ? "Syncing..." : "Sync Connected Apps"}
                  </span>
                </Button>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
