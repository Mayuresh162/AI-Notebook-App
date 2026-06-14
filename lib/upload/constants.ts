export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const SUPPORTED_UPLOAD_EXTENSIONS = [
  "pdf",
  "txt",
  "md",
  "csv",
  "json",
  "js",
  "ts",
  "jsx",
  "tsx",
  "zip",
] as const;

export type SupportedUploadExtension =
  (typeof SUPPORTED_UPLOAD_EXTENSIONS)[number];

const GENERIC_BROWSER_MIME_TYPES = new Set(["", "application/octet-stream"]);

const UPLOAD_MIME_TYPES: Record<SupportedUploadExtension, string[]> = {
  pdf: ["application/pdf"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/x-markdown", "text/plain"],
  csv: ["text/csv", "application/csv", "text/plain"],
  json: ["application/json", "text/json", "text/plain"],
  js: ["text/javascript", "application/javascript", "application/x-javascript", "text/plain"],
  ts: ["text/typescript", "application/typescript", "text/plain"],
  jsx: ["text/jsx", "text/javascript", "application/javascript", "text/plain"],
  tsx: ["text/tsx", "text/typescript", "application/typescript", "text/plain"],
  zip: ["application/zip", "application/x-zip-compressed"],
};

export function getUploadExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isSupportedUploadExtension(
  extension: string,
): extension is SupportedUploadExtension {
  return SUPPORTED_UPLOAD_EXTENSIONS.includes(
    extension as SupportedUploadExtension,
  );
}

export function isAllowedUploadMimeType(extension: string, mimeType: string) {
  const normalizedMimeType = mimeType.trim().toLowerCase().split(";")[0];

  if (GENERIC_BROWSER_MIME_TYPES.has(normalizedMimeType)) return true;
  if (!isSupportedUploadExtension(extension)) return false;

  return UPLOAD_MIME_TYPES[extension].includes(normalizedMimeType);
}
