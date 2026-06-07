import { fetchSafeRemoteText } from "@/lib/safe-fetch";

export async function loadURL(url: string) {
  try {
    const text = await fetchSafeRemoteText(url);

    if (!text || !text.trim()) {
      throw new Error("Unable to extract content");
    }

    return {
      text,
    };
  } catch {
    throw new Error("Failed to extract URL content");
  }
}
