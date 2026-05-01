import { DynamicTool } from "@langchain/core/tools";
import { google } from "googleapis";
import { getSupabase } from "@/lib/supabase";

export function getDriveTool(userId: string) {
  return new DynamicTool({
    name: "drive_search",
    description:
      "Search connected Google Drive files.",

    func: async (query: string) => {
      const supabase = getSupabase();

      const { data } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", userId)
        .eq("provider", "google")
        .single();

      if (!data) {
        return "Google Drive not connected.";
      }

      const auth = new google.auth.OAuth2();
      auth.setCredentials({
        access_token: data.access_token,
      });

      const drive = google.drive({
        version: "v3",
        auth,
      });

      const res = await drive.files.list({
        q: `name contains '${query}'`,
        pageSize: 5,
        fields: "files(id,name)",
      });

      const files = res.data.files || [];

      if (!files.length) {
        return "No Drive results.";
      }

      return files
        .map(
          (f, i) => `${i + 1}. ${f.name}`
        )
        .join("\n");
    },
  });
}