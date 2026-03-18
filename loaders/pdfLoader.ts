import { extractText } from "unpdf";

export async function loadPDF(buffer: Buffer) {
  const result = await extractText(new Uint8Array(buffer));

  const fullText = result.text.join("\n");

  return {
    text: fullText,
    source: "pdf",
  };
}
