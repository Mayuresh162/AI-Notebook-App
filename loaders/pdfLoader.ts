import pdf from "pdf-parse-new";

export async function loadPDF(buffer: Buffer) {
  const result = await pdf(buffer);

  return {
    text: result.text,
    source: "pdf",
  };
}
