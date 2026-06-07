import { requireUser } from "@/lib/supabase-server";
import { ingestTextRequest } from "@/lib/api/source-ingestion";
import { jsonError } from "@/lib/security";
import { enforceSameOriginRequest } from "@/lib/csrf";
import { consumeSourceIngestRateLimit } from "@/lib/server-controls";

export async function POST(req: Request) {
  try {
    const csrf = await enforceSameOriginRequest();

    if (csrf.error) return csrf.error;

    const auth = await requireUser();

    if (auth.error) return auth.error;

    const rate = await consumeSourceIngestRateLimit(auth.user.id);

    if (rate.error) return rate.error;

    return ingestTextRequest(req, auth.user.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process text";

    return jsonError(message, 500);
  }
}
