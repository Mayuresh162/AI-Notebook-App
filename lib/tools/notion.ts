import { DynamicTool } from "@langchain/core/tools";
import { Client } from "@notionhq/client";
import { getSupabase } from "@/lib/supabase";
import { decryptToken } from "@/lib/token-encryption";

function getNotionResultTitle(result: unknown) {
  const page = result as {
    properties?: {
      title?: {
        title?: {
          plain_text?: string;
        }[];
      };
    };
    url?: string;
  };

  return page.properties?.title?.title?.[0]?.plain_text || page.url || "Untitled";
}

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
        auth: decryptToken(data.access_token),
      });

      const result = await notion.search({
        query,
        page_size: 5,
      });

      if (!result.results.length) {
        return "No Notion results.";
      }

      return result.results
        .map((page, i) => `${i + 1}. ${getNotionResultTitle(page)}`)
        .join("\n");
    },
  });
}
