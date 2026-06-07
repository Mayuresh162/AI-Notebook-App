import { ingestGithubRepo } from "@/lib/tools/github";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    await ingestGithubRepo(url);

    return Response.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return Response.json(
      { success: false },
      { status: 500 }
    );
  }
}