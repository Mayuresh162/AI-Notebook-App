import { getSupabase } from "@/lib/supabase";
import { requireUser } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const auth = await requireUser();

    if (auth.error) return auth.error;

    const { user } = auth;
    const { names } = await req.json();

    const updatedNames = (names || []).filter(Boolean);

    if (!updatedNames.length) {
      return Response.json({ success: true });
    }

    const supabase = getSupabase();

    const { error } = await supabase.rpc("delete_documents_by_names", {
      names: updatedNames,
      auth_user_id: user.id,
    });

    if (error) {
      return Response.json({ success: false, error }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false }, { status: 500 });
  }
}
