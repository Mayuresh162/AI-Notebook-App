import { getSupabaseAdmin } from "@/lib/supabase";
import { jsonError } from "@/lib/security";

type ConsumeLimitInput = {
  subjectKey: string;
  action: string;
  limit: number;
  windowSeconds: number;
  amount?: number;
};

const CHAT_RATE_LIMIT = {
  action: "chat:minute",
  limit: 20,
  windowSeconds: 60,
};

const THREAD_CREATE_RATE_LIMIT = {
  action: "thread:create:minute",
  limit: 10,
  windowSeconds: 60,
};

const UPLOAD_START_RATE_LIMIT = {
  action: "upload:start:minute",
  limit: 10,
  windowSeconds: 60,
};

const SOURCE_INGEST_RATE_LIMIT = {
  action: "source:ingest:minute",
  limit: 12,
  windowSeconds: 60,
};

const SOURCE_DELETE_RATE_LIMIT = {
  action: "source:delete:minute",
  limit: 20,
  windowSeconds: 60,
};

const INTEGRATION_SYNC_RATE_LIMIT = {
  action: "integration:sync:minute",
  limit: 6,
  windowSeconds: 60,
};

const INGESTION_PROCESS_RATE_LIMIT = {
  action: "ingestion:process:minute",
  limit: 30,
  windowSeconds: 60,
};

const DAILY_CHAT_QUOTA = {
  action: "chat:day",
  limit: 300,
  windowSeconds: 24 * 60 * 60,
};

const DAILY_UPLOAD_BYTES_QUOTA = {
  action: "upload:bytes:day",
  limit: 100 * 1024 * 1024,
  windowSeconds: 24 * 60 * 60,
};

function getWindowStart(windowSeconds: number) {
  const windowMs = windowSeconds * 1000;
  const start = Math.floor(Date.now() / windowMs) * windowMs;

  return new Date(start).toISOString();
}

export async function consumeUsageLimit({
  subjectKey,
  action,
  limit,
  windowSeconds,
  amount = 1,
}: ConsumeLimitInput) {
  const supabase = getSupabaseAdmin();
  const windowStart = getWindowStart(windowSeconds);

  const { data, error } = await supabase.rpc("consume_usage_limit", {
    counter_subject_key: subjectKey,
    counter_action: action,
    counter_window_start: windowStart,
    counter_limit: limit,
    counter_amount: amount,
  });

  if (error) {
    return {
      error: jsonError("Usage update failed", 500),
    };
  }

  if (!data) {
    return {
      error: jsonError("Rate limit exceeded", 429),
    };
  }

  return {};
}

export function consumeChatRateLimit(userId: string) {
  return consumeUsageLimit({
    subjectKey: userId,
    ...CHAT_RATE_LIMIT,
  });
}

export function consumeDailyChatQuota(userId: string) {
  return consumeUsageLimit({
    subjectKey: userId,
    ...DAILY_CHAT_QUOTA,
  });
}

export function consumeThreadCreateRateLimit(userId: string) {
  return consumeUsageLimit({
    subjectKey: userId,
    ...THREAD_CREATE_RATE_LIMIT,
  });
}

export function consumeUploadStartRateLimit(userId: string) {
  return consumeUsageLimit({
    subjectKey: userId,
    ...UPLOAD_START_RATE_LIMIT,
  });
}

export function consumeDailyUploadBytesQuota(userId: string, bytes: number) {
  return consumeUsageLimit({
    subjectKey: userId,
    amount: bytes,
    ...DAILY_UPLOAD_BYTES_QUOTA,
  });
}

export function consumeIngestionProcessRateLimit(userId: string) {
  return consumeUsageLimit({
    subjectKey: userId,
    ...INGESTION_PROCESS_RATE_LIMIT,
  });
}

export function consumeSourceIngestRateLimit(userId: string) {
  return consumeUsageLimit({
    subjectKey: userId,
    ...SOURCE_INGEST_RATE_LIMIT,
  });
}

export function consumeSourceDeleteRateLimit(userId: string) {
  return consumeUsageLimit({
    subjectKey: userId,
    ...SOURCE_DELETE_RATE_LIMIT,
  });
}

export function consumeIntegrationSyncRateLimit(userId: string) {
  return consumeUsageLimit({
    subjectKey: userId,
    ...INTEGRATION_SYNC_RATE_LIMIT,
  });
}
