import { getSupabase } from "@/lib/supabase";
import { requireUser } from "@/lib/supabase-server";
import { jsonError, readJsonObject } from "@/lib/security";
import { getDataEnvironment } from "@/lib/app-env";
import { enforceSameOriginRequest } from "@/lib/csrf";
import { consumeSourceDeleteRateLimit } from "@/lib/server-controls";

export async function POST(req: Request) {
  try {
    const csrf = await enforceSameOriginRequest();

    if (csrf.error) return csrf.error;

    const auth = await requireUser();

    if (auth.error) return auth.error;

    const rate = await consumeSourceDeleteRateLimit(auth.user.id);

    if (rate.error) return rate.error;

    const { user } = auth;
    const body = await readJsonObject(req);

    if (body.error) return body.error;

    const names = body.data.names;

    if (!Array.isArray(names)) {
      return jsonError("names must be an array");
    }

    const updatedNames = names
      .filter((name): name is string => typeof name === "string")
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 25);

    if (!updatedNames.length) {
      return Response.json({ success: true });
    }

    const supabase = getSupabase();

    const { error } = await supabase.rpc("delete_documents_by_names", {
      names: updatedNames,
      auth_user_id: user.id,
      data_env: getDataEnvironment(),
    });

    if (error) {
      return jsonError("Failed to remove source", 500);
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
