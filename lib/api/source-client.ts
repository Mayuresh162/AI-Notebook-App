"use client";

import type { AuthorizedRequestConfig } from "@/lib/api/auth-client";
import {
  apiJsonRequest,
  ApiClientError,
  getAuthHeaders,
  readJsonResponse,
} from "@/lib/api/fetch-client";

export type SourceMetadata = {
  source?: string;
  name?: string;
  url?: string;
};

export type UrlSourceKind = "github" | "youtube" | "url";

export function getSourceName(source: SourceMetadata) {
  return source.name || source.url || "Untitled";
}

export function getSourceKey(source: SourceMetadata) {
  return source.name || source.url || source.source || "Untitled";
}

export function getUrlSourceKind(url: string): UrlSourceKind {
  if (url.includes("github.com")) return "github";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";

  return "url";
}

export function isUnauthorizedApiError(error: unknown) {
  return error instanceof ApiClientError && error.status === 401;
}

export async function fetchSourceList() {
  const res = await fetch("/api/sources");
  const data = await res.json();

  if (Array.isArray(data)) return data as SourceMetadata[];
  if (Array.isArray(data.sources)) return data.sources as SourceMetadata[];

  return [];
}

export async function removeSourceByName(
  name: string,
  config: AuthorizedRequestConfig,
) {
  const res = await apiJsonRequest<{ success: boolean }>("/api/reset", config, {
    method: "POST",
    body: { names: [name] },
  });

  return Boolean(res.success);
}

export async function uploadSourceFile(
  file: File,
  config: AuthorizedRequestConfig,
) {
  const headers = getAuthHeaders(config);
  const formData = new FormData();
  const extension = file.name.split(".").pop()?.toLowerCase();
  const endpoint = extension === "pdf" ? "/api/upload" : "/api/filesystem";

  formData.append("file", file);

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: formData,
  });

  await readJsonResponse(res);
}

export async function ingestSourceUrl(
  url: string,
  config: AuthorizedRequestConfig,
) {
  const kind = getUrlSourceKind(url);
  const endpoint =
    kind === "github"
      ? "/api/github"
      : kind === "youtube"
        ? "/api/youtube"
        : "/api/url";

  await apiJsonRequest(endpoint, config, {
    method: "POST",
    body: { url },
  });

  return kind;
}

export async function ingestSourceText(
  text: string,
  config: AuthorizedRequestConfig,
) {
  await apiJsonRequest("/api/text", config, {
    method: "POST",
    body: { text },
  });
}

export async function syncConnectedSources(config: AuthorizedRequestConfig) {
  await apiJsonRequest("/api/integrations/sync", config, {
    method: "POST",
  });
}

export function connectGoogleDrive() {
  window.location.href = "/api/integrations/google/connect";
}

export function connectNotion() {
  window.location.href = "/api/integrations/notion/connect";
}
