import { getEmbedding } from "@/lib/embeddings";
import { searchDocuments } from "@/lib/search";

export type SearchMatch = {
  id?: string;
  content?: string;
  similarity?: number;
  metadata?: {
    source?: string;
    name?: string;
    url?: string;
  };
};

const MAX_RETRIEVAL_CONTEXT_CHARS = 12_000;

function normalizeMatches(rawMatches: unknown): SearchMatch[] {
  if (Array.isArray(rawMatches)) return rawMatches as SearchMatch[];

  if (rawMatches && typeof rawMatches === "object") {
    const result = rawMatches as {
      data?: unknown;
      matches?: unknown;
    };

    if (Array.isArray(result.data)) return result.data as SearchMatch[];
    if (Array.isArray(result.matches)) return result.matches as SearchMatch[];
  }

  return [];
}

function rankAndDedupeMatches(matches: SearchMatch[]) {
  const sorted = [...matches].sort(
    (a, b) => (b.similarity || 0) - (a.similarity || 0),
  );

  const unique = new Map<string, SearchMatch>();

  for (const doc of sorted) {
    const key = doc.content?.slice(0, 100);

    if (key && !unique.has(key)) {
      unique.set(key, doc);
    }
  }

  return Array.from(unique.values());
}

function buildContext(docs: SearchMatch[]) {
  const context = docs
    .map(
      (doc, index) =>
        `Source ${index + 1} (${doc.metadata?.source || "unknown"}):
    ${doc.content}`,
    )
    .join("\n\n---\n\n");

  return context.slice(0, MAX_RETRIEVAL_CONTEXT_CHARS);
}

export async function getChatRetrievalContext(
  question: string,
  userId: string,
  selectedSources: string[] = [],
) {
  const queryEmbedding = await getEmbedding(question);
  const rawMatches = await searchDocuments(
    queryEmbedding,
    userId,
    selectedSources.length > 0 ? selectedSources : undefined,
  );
  const matches = normalizeMatches(rawMatches);
  const docs = rankAndDedupeMatches(matches).slice(0, 5);

  return {
    docs,
    context: buildContext(docs),
  };
}
