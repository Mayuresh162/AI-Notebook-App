import { DynamicTool } from "@langchain/core/tools";
import { Client } from "@notionhq/client";
import { getSupabase } from "@/lib/supabase";

export function getNotionTool(userId: string) {
  return new DynamicTool({
    name: "notion_search",
    description:
      "Search connected Notion pages.",

    func: async (query: string) => {
      const supabase = getSupabase();

      const { data } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", userId)
        .eq("provider", "notion")
        .single();

      if (!data) {
        return "Notion not connected.";
      }

      const notion = new Client({
        auth: data.access_token,
      });

      const result = await notion.search({
        query,
        page_size: 5,
      });

      if (!result.results.length) {
        return "No Notion results.";
      }

      return result.results
        .map((p: any, i: number) => {
          const title =
            p.properties?.title?.title?.[0]
              ?.plain_text ||
            p.url;

          return `${i + 1}. ${title}`;
        })
        .join("\n");
    },
  });
}