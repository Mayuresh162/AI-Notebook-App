import { jsonError } from "@/lib/security";
import { processQueuedIngestionJobs } from "@/lib/upload/ingestion-jobs";

function isAuthorized(req: Request) {
  const secret = process.env.INGESTION_CRON_SECRET;

  if (!secret) return false;

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const header = req.headers.get("x-ingestion-cron-secret");

  return bearer === secret || header === secret;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const result = await processQueuedIngestionJobs();

    return Response.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process ingestion jobs";

    return jsonError(message, 500);
  }
}
