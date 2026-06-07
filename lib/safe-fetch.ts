import * as cheerio from "cheerio";
import { validatePublicUrl } from "@/lib/security";

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_REMOTE_BYTES = 2 * 1024 * 1024;
const SAFE_CONTENT_TYPES = [
  "text/html",
  "text/plain",
  "application/xhtml+xml",
  "application/json",
];

function isSafeContentType(contentType: string | null) {
  if (!contentType) return false;

  return SAFE_CONTENT_TYPES.some((type) =>
    contentType.toLowerCase().includes(type),
  );
}

function sanitizeHtmlToText(html: string) {
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe, object, embed").remove();
  $("*").each((_, element) => {
    if (!("attribs" in element)) return;

    const attributes = { ...element.attribs };

    for (const name of Object.keys(attributes)) {
      if (name.toLowerCase().startsWith("on")) {
        $(element).removeAttr(name);
      }
    }
  });

  return $("body").text().replace(/\s+/g, " ").trim();
}

function sanitizePlainText(text: string) {
  return text.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

async function readLimitedText(response: Response) {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("No response body");
  }

  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;
    if (!value) continue;

    received += value.length;

    if (received > MAX_REMOTE_BYTES) {
      throw new Error("Remote response is too large");
    }

    chunks.push(value);
  }

  return new TextDecoder("utf-8", {
    fatal: false,
  }).decode(Buffer.concat(chunks));
}

export async function fetchSafeRemoteText(rawUrl: string) {
  let currentUrl = validatePublicUrl(rawUrl);

  if (currentUrl.error) throw new Error("Invalid URL");

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl.url, {
        redirect: "manual",
        signal: controller.signal,
      });

      if (
        response.status >= 300 &&
        response.status < 400 &&
        response.headers.get("location")
      ) {
        const next = new URL(
          response.headers.get("location") || "",
          currentUrl.url,
        ).toString();
        currentUrl = validatePublicUrl(next);

        if (currentUrl.error) throw new Error("Unsafe redirect URL");
        continue;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch URL");
      }

      if (!isSafeContentType(response.headers.get("content-type"))) {
        throw new Error("Unsupported URL content type");
      }

      const contentLength = Number(response.headers.get("content-length"));

      if (Number.isFinite(contentLength) && contentLength > MAX_REMOTE_BYTES) {
        throw new Error("Remote response is too large");
      }

      const body = await readLimitedText(response);
      const contentType = response.headers.get("content-type")?.toLowerCase() || "";

      if (
        contentType.includes("text/plain") ||
        contentType.includes("application/json")
      ) {
        return sanitizePlainText(body);
      }

      return sanitizeHtmlToText(body);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("Too many redirects");
}
