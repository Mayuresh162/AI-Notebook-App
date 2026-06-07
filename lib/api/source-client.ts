"use client";

import type { AuthorizedRequestConfig } from "@/lib/api/auth-client";
import {
  apiJsonRequest,
  ApiClientError,
  getAuthHeaders,
  readJsonResponse,
} from "@/lib/api/fetch-client";

export const UPLOAD_STATUS_POLL_MS = 3_000;

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
  onProgress?: (progress: number) => void,
) {
  const headers = getAuthHeaders(config);
  headers.set("Content-Type", "application/json");

  const sessionRes = await fetch("/api/uploads", {
    method: "POST",
    headers,
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    }),
  });

  const sessionData = await readJsonResponse<{
    session: {
      id: string;
      part_count: number;
    };
    partSize: number;
  }>(sessionRes);
  const uploadHeaders = getAuthHeaders(config);
  let uploadedParts = 0;

  for (let start = 0; start < file.size; start += sessionData.partSize) {
    const partNumber = Math.floor(start / sessionData.partSize) + 1;
    const chunk = file.slice(start, start + sessionData.partSize);
    const partHeaders = new Headers(uploadHeaders);

    partHeaders.set("x-upload-part-number", String(partNumber));

    const partRes = await fetch(
      `/api/uploads/${sessionData.session.id}/parts`,
      {
        method: "POST",
        headers: partHeaders,
        body: chunk,
      },
    );

    await readJsonResponse(partRes);
    uploadedParts += 1;
    onProgress?.(
      Math.round((uploadedParts / sessionData.session.part_count) * 100),
    );
  }

  const completeRes = await fetch(
    `/api/uploads/${sessionData.session.id}/complete`,
    {
      method: "POST",
      headers: uploadHeaders,
    },
  );

  await readJsonResponse(completeRes);

  return {
    sessionId: sessionData.session.id,
  };
}

export async function fetchUploadIngestionStatus(
  sessionId: string,
  config: AuthorizedRequestConfig,
) {
  const headers = getAuthHeaders(config);

  const res = await fetch(`/api/uploads/${sessionId}`, {
    headers,
  });
  const data = await readJsonResponse<{
    session: {
      status: string;
    };
  }>(res);

  return data.session.status;
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
