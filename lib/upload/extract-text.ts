import { loadPDF } from "@/loaders/pdfLoader";
import { loadZip } from "@/loaders/zipLoader";
import { getUploadExtension } from "@/lib/upload/constants";

export type ExtractedUploadText = {
  text: string;
  source: string;
};

export async function extractUploadText(
  buffer: Buffer,
  filename: string,
): Promise<ExtractedUploadText> {
  const extension = getUploadExtension(filename);

  if (extension === "pdf") {
    const result = await loadPDF(buffer);

    return {
      text: result.text,
      source: "pdf",
    };
  }

  if (extension === "zip") {
    const result = await loadZip(buffer);

    return {
      text: result.text,
      source: result.source,
    };
  }

  return {
    text: buffer.toString("utf8"),
    source: "filesystem",
  };
}
