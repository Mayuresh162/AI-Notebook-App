import { getEmbedding } from "../embeddings";
import { getSupabase } from "../supabase";

function parseRepo(url: string) {
  const parts =
    url.replace(
      "https://github.com/",
      ""
    ).split("/");

  return {
    owner: parts[0],
    repo: parts[1],
  };
}

export async function ingestGithubRepo(
  url: string
) {
  const { owner, repo } =
    parseRepo(url);

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    {
      headers: {
        Accept:
          "application/vnd.github.raw+json",
      },
    }
  );

  const readme =
    await res.text();

  const embedding =
    await getEmbedding(readme);

  const supabase =
    getSupabase();

  await supabase
    .from("documents")
    .insert({
      content: readme,
      embedding,
      metadata: {
        name: `${owner}/${repo}`,
        source: "github",
        url,
      },
      env: process.env.NODE_ENV === "development" ? "dev" : "prod",
    });
}