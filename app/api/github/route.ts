import { ingestGithubRepo } from "@/lib/tools/github";
import { requireUser } from "@/lib/supabase-server";
import {
  getRequiredString,
  jsonError,
  readJsonObject,
  validatePublicUrl,
} from "@/lib/security";
import { enforceSameOriginRequest } from "@/lib/csrf";
import { consumeSourceIngestRateLimit } from "@/lib/server-controls";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const csrf = await enforceSameOriginRequest();

    if (csrf.error) return csrf.error;

    const auth = await requireUser();

    if (auth.error) return auth.error;

    const rate = await consumeSourceIngestRateLimit(auth.user.id);

    if (rate.error) return rate.error;

    const body = await readJsonObject(req);

    if (body.error) return body.error;

    const urlResult = getRequiredString(body.data, "url", 2_048);

    if (urlResult.error) return urlResult.error;

    const safeUrl = validatePublicUrl(urlResult.value, ["github.com"]);

    if (safeUrl.error) return safeUrl.error;

    await ingestGithubRepo(safeUrl.url, auth.user.id);

    return Response.json({
      success: true,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to ingest GitHub repository";

    return jsonError(message, 500);
  }
}
