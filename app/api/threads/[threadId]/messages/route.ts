import { getSupabaseAdmin } from "@/lib/supabase";
import { requireUser } from "@/lib/supabase-server";
import { getRequiredString, jsonError, readJsonObject } from "@/lib/security";
import { enforceSameOriginRequest } from "@/lib/csrf";

type RouteContext = {
  params: Promise<{
    threadId: string;
  }>;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

async function requireOwnedThread(threadId: string, userId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("threads")
    .select("id")
    .eq("id", threadId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return {
      error: jsonError("Thread not found", 404),
    };
  }

  return {
    thread: data,
  };
}

function getPaginationParams(req: Request) {
  const url = new URL(req.url);
  const requestedLimit = Number(url.searchParams.get("limit") || DEFAULT_LIMIT);
  const limit = Math.min(
    Math.max(Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const before = url.searchParams.get("before");

  return {
    limit,
    before,
  };
}

export async function GET(req: Request, context: RouteContext) {
  const auth = await requireUser();

  if (auth.error) return auth.error;

  const { threadId } = await context.params;
  const owned = await requireOwnedThread(threadId, auth.user.id);

  if (owned.error) return owned.error;

  const { limit, before } = getPaginationParams(req);
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("messages")
    .select("id, thread_id, role, content, sources, created_at")
    .eq("thread_id", threadId)
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;

  if (error) {
    return jsonError(error.message, 500);
  }

  const newestFirst = data || [];
  const chronological = [...newestFirst].reverse();
  const oldest = newestFirst[newestFirst.length - 1];

  return Response.json({
    messages: chronological,
    nextCursor: newestFirst.length === limit ? oldest?.created_at || null : null,
  });
}

export async function POST(req: Request, context: RouteContext) {
  const csrf = await enforceSameOriginRequest();

  if (csrf.error) return csrf.error;

  const auth = await requireUser();

  if (auth.error) return auth.error;

  const { threadId } = await context.params;
  const owned = await requireOwnedThread(threadId, auth.user.id);

  if (owned.error) return owned.error;

  const body = await readJsonObject(req);

  if (body.error) return body.error;

  const role = body.data.role;

  if (role !== "user" && role !== "assistant") {
    return jsonError("Invalid message role");
  }

  const contentResult = getRequiredString(body.data, "content", 200_000);

  if (contentResult.error) return contentResult.error;

  const supabase = getSupabaseAdmin();
  const sources = Array.isArray(body.data.sources) ? body.data.sources : null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      user_id: auth.user.id,
      role,
      content: contentResult.value,
      sources,
    })
    .select("id, thread_id, role, content, sources, created_at")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  await supabase
    .from("threads")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId)
    .eq("user_id", auth.user.id);

  return Response.json({
    message: data,
  });
}
