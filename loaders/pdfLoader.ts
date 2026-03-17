export async function loadPDF(buffer: Buffer) {
  try {
    // ✅ ESM-safe dynamic import
    const pdfModule = await import("pdf-parse");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdf = (pdfModule as any).default || pdfModule;

    const result = await pdf(buffer);

    return {
      text: result.text,
      source: "pdf",
    };
  } catch (error) {
    console.error("PDF parse error:", error);
    throw new Error("Failed to parse PDF");
  }
}
