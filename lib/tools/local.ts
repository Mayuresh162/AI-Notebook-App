import { DynamicTool } from "@langchain/core/tools";
import { getEmbedding } from "@/lib/embeddings";
import { searchDocuments } from "@/lib/search";

export function getLocalSearchTool(userId: string) {
  return new DynamicTool({
    name: "local_search",
    description:
      "Search uploaded user sources.",

    func: async (query: string) => {
      const embedding = await getEmbedding(query);

      const docs = await searchDocuments(
        embedding,
        userId
      );

      if (!docs?.length) {
        return "No local sources found.";
      }

      return docs
        .slice(0, 5)
        .map(
          (d: any) =>
            `${d.metadata?.name}\n${d.content}`
        )
        .join("\n\n");
    },
  });
}