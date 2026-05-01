import { NextRequest } from "next/server";
import { embedAndStore } from "@/lib/filesystem";
import { requireUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();

    if (auth.error) return auth.error;

    const { user } = auth;
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file" }, { status: 400 });
    }

    const text = await file.text();

    await embedAndStore(text, file.name, file.type, user.id);

    return Response.json({
      success: true,
      name: file.name,
    });
  } catch (err) {
    console.error(err);

    return Response.json({ success: false }, { status: 500 });
  }
}
