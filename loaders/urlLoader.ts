import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export async function loadURL(url: string) {
  const res = await fetch(url);
  const html = await res.text();

  const dom = new JSDOM(html, { url });

  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent) {
    throw new Error("Unable to extract article content");
  }

  return {
    text: article.textContent,
  };
}
