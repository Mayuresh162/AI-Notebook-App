"use client";

import { type FormEvent, useState } from "react";
import { Link, Type } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type SourceUploadMode = "link" | "text";

type SourceUploadDialogProps = {
  open: boolean;
  mode: SourceUploadMode;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: SourceUploadMode) => void;
  onSubmit: (mode: SourceUploadMode, value: string) => Promise<void>;
};

export function SourceUploadDialog({
  open,
  mode,
  submitting,
  onOpenChange,
  onModeChange,
  onSubmit,
}: SourceUploadDialogProps) {
  const t = useTranslations("sourceDialog");
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const value = mode === "link" ? link.trim() : text.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!value) {
      setError(mode === "link" ? t("linkRequired") : t("textRequired"));
      return;
    }

    setError("");
    await onSubmit(mode, value);
    setLink("");
    setText("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs
            value={mode}
            onValueChange={(nextMode) => {
              onModeChange(nextMode as SourceUploadMode);
              setError("");
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">
                <Link className="mr-1.5 size-3.5" />
                {t("linkTab")}
              </TabsTrigger>
              <TabsTrigger value="text">
                <Type className="mr-1.5 size-3.5" />
                {t("textTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-2">
              <label className="sr-only" htmlFor="source-link">
                {t("linkLabel")}
              </label>
              <Input
                id="source-link"
                aria-describedby={error ? "source-upload-error" : undefined}
                value={link}
                onChange={(event) => setLink(event.target.value)}
                placeholder={t("linkPlaceholder")}
                disabled={submitting}
              />
            </TabsContent>

            <TabsContent value="text" className="space-y-2">
              <label className="sr-only" htmlFor="source-text">
                {t("textLabel")}
              </label>
              <Textarea
                id="source-text"
                aria-describedby={error ? "source-upload-error" : undefined}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={t("textPlaceholder")}
                disabled={submitting}
              />
            </TabsContent>
          </Tabs>

          {error && (
            <p id="source-upload-error" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("submitting") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
