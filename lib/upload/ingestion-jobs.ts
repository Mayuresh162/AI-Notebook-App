import { getSupabaseAdmin } from "@/lib/supabase";
import { ingestTextForUser } from "@/lib/api/source-ingestion";
import { extractUploadText } from "@/lib/upload/extract-text";
import {
  INGESTION_BATCH_SIZE,
  MAX_INGESTION_ATTEMPTS,
  UPLOAD_STORAGE_BUCKET,
} from "@/lib/upload/constants";
import { consumeIngestionProcessRateLimit } from "@/lib/server-controls";
import { validateUploadContent } from "@/lib/upload/validate-content";

type SourceUploadPart = {
  part_number: number;
  storage_path: string;
  size_bytes: number;
};

type SourceIngestionJob = {
  id: string;
  session_id: string;
  user_id: string;
  attempts: number;
  max_attempts: number;
  source_metadata: {
    name?: string;
    fileType?: string;
    sizeBytes?: number;
    partCount?: number;
  } | null;
};

const STALE_PROCESSING_MINUTES = 15;

function getRetryTime(attempts: number) {
  const delaySeconds = Math.min(60 * 2 ** attempts, 15 * 60);

  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

async function downloadPart(path: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(UPLOAD_STORAGE_BUCKET)
    .download(path);

  if (error || !data) {
    throw new Error(`Failed to download upload part: ${error?.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

async function removeParts(parts: SourceUploadPart[]) {
  const paths = parts.map((part) => part.storage_path);

  if (paths.length === 0) return;

  const supabase = getSupabaseAdmin();
  await supabase.storage.from(UPLOAD_STORAGE_BUCKET).remove(paths);
}

async function getSessionParts(sessionId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("source_upload_parts")
    .select("part_number, storage_path, size_bytes")
    .eq("session_id", sessionId)
    .order("part_number", { ascending: true });

  if (error) {
    throw new Error(`Failed to load upload parts: ${error.message}`);
  }

  return (data || []) as SourceUploadPart[];
}

async function processJob(job: SourceIngestionJob) {
  const rate = await consumeIngestionProcessRateLimit(job.user_id);

  if (rate.error) {
    throw new Error("Ingestion processing rate limit exceeded");
  }

  const supabase = getSupabaseAdmin();
  const parts = await getSessionParts(job.session_id);
  const expectedSize = job.source_metadata?.sizeBytes;
  const expectedPartCount = job.source_metadata?.partCount;
  const actualSize = parts.reduce((total, part) => total + part.size_bytes, 0);

  if (
    !parts.length ||
    (expectedPartCount && parts.length !== expectedPartCount) ||
    (expectedSize && actualSize !== expectedSize)
  ) {
    throw new Error("Upload parts are incomplete");
  }

  const buffers = await Promise.all(
    parts.map((part) => downloadPart(part.storage_path)),
  );
  const fileBuffer = Buffer.concat(buffers);
  const filename = job.source_metadata?.name || "upload";

  if (!validateUploadContent(fileBuffer, filename)) {
    throw new Error("Uploaded file content failed validation");
  }

  const extracted = await extractUploadText(fileBuffer, filename);

  await ingestTextForUser(
    extracted.text,
    {
      source: extracted.source,
      name: filename,
      fileType: job.source_metadata?.fileType,
      created_at: new Date().toISOString(),
    },
    job.user_id,
  );

  await supabase
    .from("source_ingestion_jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      error: null,
    })
    .eq("id", job.id);

  await supabase
    .from("source_upload_sessions")
    .update({
      status: "completed",
      error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.session_id)
    .eq("user_id", job.user_id);

  await removeParts(parts);
}

async function markJobFailed(job: SourceIngestionJob, error: unknown) {
  const supabase = getSupabaseAdmin();
  const attempts = job.attempts + 1;
  const exhausted = attempts >= job.max_attempts;
  const message =
    error instanceof Error ? error.message : "Ingestion job failed";

  await supabase
    .from("source_ingestion_jobs")
    .update({
      attempts,
      status: exhausted ? "failed" : "queued",
      error: exhausted ? "Indexing failed" : message,
      next_retry_at: exhausted ? null : getRetryTime(attempts),
      completed_at: null,
    })
    .eq("id", job.id);

  await supabase
    .from("source_upload_sessions")
    .update({
      status: exhausted ? "failed" : "queued",
      error: exhausted ? "Indexing failed" : message,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.session_id)
    .eq("user_id", job.user_id);
}

export async function enqueueIngestionJob(sessionId: string, userId: string) {
  const supabase = getSupabaseAdmin();

  const { data: session, error: sessionError } = await supabase
    .from("source_upload_sessions")
    .select("id, filename, mime_type, size_bytes, part_count")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError || !session) {
    throw new Error("Upload session not found");
  }

  const { data, error } = await supabase
    .from("source_ingestion_jobs")
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        status: "queued",
        attempts: 0,
        max_attempts: MAX_INGESTION_ATTEMPTS,
        next_retry_at: new Date().toISOString(),
        source_metadata: {
          name: session.filename,
          fileType: session.mime_type,
          sizeBytes: session.size_bytes,
          partCount: session.part_count,
        },
      },
      {
        onConflict: "session_id",
      },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to queue ingestion: ${error?.message}`);
  }

  await supabase
    .from("source_upload_sessions")
    .update({
      status: "queued",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  return data;
}

export async function processQueuedIngestionJobs() {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const staleStartedAt = new Date(
    Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000,
  ).toISOString();

  await supabase
    .from("source_ingestion_jobs")
    .update({
      status: "queued",
      next_retry_at: now,
      error: "Recovered stale processing job",
    })
    .eq("status", "processing")
    .lt("started_at", staleStartedAt);

  const { data, error } = await supabase
    .from("source_ingestion_jobs")
    .select(
      "id, session_id, user_id, attempts, max_attempts, source_metadata",
    )
    .eq("status", "queued")
    .lte("next_retry_at", now)
    .lt("attempts", MAX_INGESTION_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(INGESTION_BATCH_SIZE);

  if (error) {
    throw new Error(`Failed to load ingestion jobs: ${error.message}`);
  }

  const jobs = (data || []) as SourceIngestionJob[];
  let completed = 0;
  let failed = 0;

  for (const job of jobs) {
    await supabase
      .from("source_ingestion_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    await supabase
      .from("source_upload_sessions")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.session_id)
      .eq("user_id", job.user_id);

    try {
      await processJob(job);
      completed += 1;
    } catch (jobError) {
      await markJobFailed(job, jobError);
      failed += 1;
    }
  }

  return {
    processed: jobs.length,
    completed,
    failed,
  };
}
