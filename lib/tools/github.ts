import { ingestDocument } from "@/lib/ingest";

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
  url: string,
  userId: string,
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

  if (!res.ok) {
    throw new Error("Failed to fetch GitHub repository README");
  }

  const readme =
    await res.text();

  await ingestDocument(readme, {
    name: `${owner}/${repo}`,
    source: "github",
    url,
  }, userId);
}
