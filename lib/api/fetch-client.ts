"use client";

import type { AuthorizedRequestConfig } from "@/lib/api/auth-client";

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

export function getAuthHeaders(config: AuthorizedRequestConfig) {
  return new Headers(config.headers);
}

export async function readJsonResponse<T>(
  res: Response,
  fallbackMessage = "Request failed",
): Promise<T> {
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      data && typeof data.error === "string" ? data.error : fallbackMessage;

    throw new ApiClientError(message, res.status);
  }

  return data as T;
}

export async function apiJsonRequest<T>(
  url: string,
  config: AuthorizedRequestConfig,
  init: Omit<RequestInit, "headers" | "body"> & {
    body?: unknown;
  } = {},
) {
  const headers = getAuthHeaders(config);
  let body: BodyInit | undefined;

  if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.body);
  }

  const res = await fetch(url, {
    ...init,
    headers,
    body,
  });

  return readJsonResponse<T>(res);
}
