import { DynamicTool } from "@langchain/core/tools";

export const webTool = new DynamicTool({
  name: "fetch_url",
  description: "Fetch webpage text from URL",
  func: async (url: string) => {
    try {
      const res = await fetch(url);
      const text = await res.text();
      return text.slice(0, 4000);
    } catch {
      return "Unable to fetch URL";
    }
  },
});

export const webSearchTool = new DynamicTool({
  name: "web_search",
  description:
    "Search the internet for recent facts, news, trends, updates and live information.",
  func: async (query: string) => {
    try {
      const url =
        `https://searx.be/search?q=${encodeURIComponent(query)}&format=json`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      const data = await res.json();

      const results =
        data?.results?.slice(0, 5) || [];

      if (!results.length) {
        return "No results found.";
      }

      return results
        .map(
          (r: any, i: number) =>
            `${i + 1}. ${r.title}\n${r.content}\n${r.url}`
        )
        .join("\n\n");
    } catch (err) {
      console.error(err);
      return "Search failed.";
    }
  },
});