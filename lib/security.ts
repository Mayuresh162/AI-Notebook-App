import {
  getUploadExtension,
  isAllowedUploadMimeType,
} from "@/lib/upload/constants";

const MAX_JSON_TEXT_LENGTH = 200_000;
const MAX_QUESTION_LENGTH = 4_000;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_URL_LENGTH = 2_048;

type JsonObject = Record<string, unknown>;

type SourceDocument = {
  id?: string;
  similarity?: number;
  metadata?: {
    source?: unknown;
    name?: unknown;
    url?: unknown;
  };
};

export type SanitizedSource = {
  id?: string;
  similarity?: number;
  metadata: {
    source?: string;
    name?: string;
    url?: string;
  };
};

export function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function readJsonObject(req: Request) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { error: jsonError("Invalid JSON body") };
    }

    return { data: body as JsonObject };
  } catch {
    return { error: jsonError("Invalid JSON body") };
  }
}

export function getRequiredString(
  body: JsonObject,
  key: string,
  maxLength = MAX_JSON_TEXT_LENGTH,
) {
  const value = body[key];

  if (typeof value !== "string" || !value.trim()) {
    return { error: jsonError(`${key} is required`) };
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    return { error: jsonError(`${key} is too large`, 413) };
  }

  return { value: trimmed };
}

export function validateQuestion(body: JsonObject) {
  return getRequiredString(body, "question", MAX_QUESTION_LENGTH);
}

export function sanitizeMemory(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 20).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];

    const record = entry as Record<string, unknown>;
    const key = typeof record.key === "string" ? record.key.slice(0, 100) : "";
    const memoryValue =
      typeof record.value === "string" ? record.value.slice(0, 1_000) : "";

    if (!key || !memoryValue) return [];

    return [{ key, value: memoryValue }];
  });
}

export function sanitizeSourceKeys(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (typeof entry !== "string") return [];

    const trimmed = entry.trim().slice(0, 255);

    return trimmed ? [trimmed] : [];
  });
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  if (/^127\./.test(normalized) || /^10\./.test(normalized)) return true;
  if (/^192\.168\./.test(normalized)) return true;

  const match = normalized.match(/^172\.(\d+)\./);

  if (match) {
    const secondOctet = Number(match[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
}

export function validatePublicUrl(rawUrl: string, allowedHosts?: string[]) {
  if (rawUrl.length > MAX_URL_LENGTH) {
    return { error: jsonError("URL is too long", 413) };
  }

  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return { error: jsonError("Invalid URL") };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { error: jsonError("Only HTTP and HTTPS URLs are supported") };
  }

  if (isPrivateHostname(parsed.hostname)) {
    return { error: jsonError("Private or local URLs are not allowed") };
  }

  if (
    allowedHosts &&
    !allowedHosts.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    )
  ) {
    return { error: jsonError("URL host is not supported") };
  }

  return { url: parsed.toString(), hostname: parsed.hostname };
}

export function validateFile(
  file: File | null,
  allowedExtensions: string[],
  maxBytes = MAX_FILE_SIZE_BYTES,
) {
  if (!file) return { error: jsonError("No file", 400) };

  if (file.size <= 0) {
    return { error: jsonError("Uploaded file is empty") };
  }

  if (file.size > maxBytes) {
    return { error: jsonError("File is too large", 413) };
  }

  const extension = getUploadExtension(file.name);

  if (!extension || !allowedExtensions.includes(extension)) {
    return { error: jsonError("File type is not supported", 415) };
  }

  if (!isAllowedUploadMimeType(extension, file.type || "")) {
    return { error: jsonError("File MIME type is not supported", 415) };
  }

  return { file };
}

export function sanitizeSourcesForClient(
  sources: SourceDocument[],
): SanitizedSource[] {
  return sources.map((source) => ({
    id: source.id,
    similarity: source.similarity,
    metadata: {
      source:
        typeof source.metadata?.source === "string"
          ? source.metadata.source
          : undefined,
      name:
        typeof source.metadata?.name === "string"
          ? source.metadata.name
          : undefined,
      url:
        typeof source.metadata?.url === "string" ? source.metadata.url : undefined,
    },
  }));
}
