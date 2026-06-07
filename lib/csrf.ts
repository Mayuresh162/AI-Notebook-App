import { headers } from "next/headers";
import { jsonError } from "@/lib/security";

function getAllowedOrigins(host: string | null) {
  const origins = new Set<string>();

  if (host) {
    origins.add(`https://${host}`);
    origins.add(`http://${host}`);
  }

  if (process.env.APP_URL) {
    origins.add(process.env.APP_URL.replace(/\/$/, ""));
  }

  return origins;
}

export async function enforceSameOriginRequest() {
  const headersList = await headers();
  const authorization = headersList.get("authorization");

  if (authorization?.match(/^Bearer\s+/i)) return {};

  const host = headersList.get("host");
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");
  const allowedOrigins = getAllowedOrigins(host);
  let candidate = origin;

  if (!candidate && referer) {
    try {
      candidate = new URL(referer).origin;
    } catch {
      return { error: jsonError("Invalid request origin", 403) };
    }
  }

  if (!candidate || !allowedOrigins.has(candidate)) {
    return {
      error: jsonError("Invalid request origin", 403),
    };
  }

  return {};
}
