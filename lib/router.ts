export type SearchMode =
  | "sources"
  | "web"
  | "hybrid"
  | "general";

export function detectMode(
  question: string,
  hasSources: boolean
): SearchMode {
  const q = question.toLowerCase();

  const freshWords = [
    "latest",
    "today",
    "recent",
    "current",
    "news",
    "2026",
    "price",
    "stock",
    "trend",
    "update",
  ];

  const wantsFresh = freshWords.some((w) =>
    q.includes(w)
  );

  if (!hasSources) {
    return wantsFresh
      ? "web"
      : "general";
  }

  if (wantsFresh) {
    return "hybrid";
  }

  return "sources";
}