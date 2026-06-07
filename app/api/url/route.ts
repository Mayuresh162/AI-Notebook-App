import { loadURL } from "@/loaders/urlLoader";
import { requireUser } from "@/lib/supabase-server";
import { ingestUrlRequest } from "@/lib/api/source-ingestion";
import { enforceSameOriginRequest } from "@/lib/csrf";
import { consumeSourceIngestRateLimit } from "@/lib/server-controls";

export async function POST(req: Request) {
  const csrf = await enforceSameOriginRequest();

  if (csrf.error) return csrf.error;

  const auth = await requireUser();

  if (auth.error) return auth.error;

  const rate = await consumeSourceIngestRateLimit(auth.user.id);

  if (rate.error) return rate.error;

  return ingestUrlRequest(req, auth.user.id, {
    source: "url",
    load: loadURL,
  });
}
