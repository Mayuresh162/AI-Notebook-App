import {
  getUploadExtension,
  type SupportedUploadExtension,
} from "@/lib/upload/constants";

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "csv",
  "json",
  "js",
  "ts",
  "jsx",
  "tsx",
]);

function isPdf(buffer: Buffer) {
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") return false;

  const sample = buffer.subarray(0, Math.min(buffer.length, 2_000_000)).toString("latin1");
  const suspiciousMarkers = [
    "/Encrypt",
    "/JavaScript",
    "/JS",
    "/OpenAction",
    "/AA",
    "/Launch",
    "/EmbeddedFile",
  ];

  return !suspiciousMarkers.some((marker) => sample.includes(marker));
}

function isZip(buffer: Buffer) {
  const signature = buffer.subarray(0, 4).toString("hex");

  return ["504b0304", "504b0506", "504b0708"].includes(signature);
}

function isUtf8Text(buffer: Buffer) {
  const decoded = new TextDecoder("utf-8", {
    fatal: true,
  }).decode(buffer);

  if (decoded.includes("\u0000")) return false;

  const controls = decoded.match(/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/g);
  const controlRatio = (controls?.length || 0) / Math.max(decoded.length, 1);

  if (controlRatio > 0.01) return false;

  return true;
}

export function validateUploadContent(buffer: Buffer, filename: string) {
  const extension = getUploadExtension(filename) as SupportedUploadExtension;

  if (extension === "pdf") return isPdf(buffer);
  if (extension === "zip") return isZip(buffer);
  if (TEXT_EXTENSIONS.has(extension)) {
    try {
      return isUtf8Text(buffer);
    } catch {
      return false;
    }
  }

  return false;
}
