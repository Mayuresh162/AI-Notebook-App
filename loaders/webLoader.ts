import * as cheerio from "cheerio";

export async function loadWebPage(url: string) {
  const res = await fetch(url);

  const html = await res.text();

  const $ = cheerio.load(html);

  const text = $("body").text();

  return {
    text,
    source: url,
  };
}
