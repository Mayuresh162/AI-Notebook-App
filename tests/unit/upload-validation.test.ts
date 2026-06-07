import { validateUploadContent } from "@/lib/upload/validate-content";

describe("validateUploadContent", () => {
  it("validates PDF and ZIP magic bytes", () => {
    expect(validateUploadContent(Buffer.from("%PDF-1.4"), "paper.pdf")).toBe(true);
    expect(validateUploadContent(Buffer.from("not a pdf"), "paper.pdf")).toBe(false);
    expect(validateUploadContent(Buffer.from("504b0304", "hex"), "archive.zip")).toBe(true);
    expect(validateUploadContent(Buffer.from("not a zip"), "archive.zip")).toBe(false);
  });

  it("rejects suspicious PDF active content markers", () => {
    expect(
      validateUploadContent(Buffer.from("%PDF-1.4\n/OpenAction\n/JavaScript"), "paper.pdf"),
    ).toBe(false);
  });

  it("validates safe UTF-8 text and rejects null/control-heavy text", () => {
    expect(validateUploadContent(Buffer.from("hello\nworld", "utf8"), "notes.txt")).toBe(
      true,
    );
    expect(validateUploadContent(Buffer.from("hello\u0000world", "utf8"), "notes.txt")).toBe(
      false,
    );
    expect(validateUploadContent(Buffer.from("\u0001\u0002\u0003abc", "utf8"), "notes.txt")).toBe(
      false,
    );
  });
});
