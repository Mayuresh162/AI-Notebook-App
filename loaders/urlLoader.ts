import * as cheerio from "cheerio";

export async function loadURL(url: string) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    const $ = cheerio.load(html);

    // remove unwanted tags
    $("script, style, noscript").remove();

    const text = $("body").text();

    if (!text || !text.trim()) {
      throw new Error("Unable to extract content");
    }

    return {
      text: text.replace(/\s+/g, " ").trim(),
    };
  } catch (error) {
    console.error("URL parse error:", error);
    throw new Error("Failed to extract URL content");
  }
}
