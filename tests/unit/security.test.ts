import {
  sanitizeSourcesForClient,
  validateFile,
  validatePublicUrl,
} from "@/lib/security";
import {
  isAllowedUploadMimeType,
  MAX_UPLOAD_BYTES,
} from "@/lib/upload/constants";

describe("validatePublicUrl", () => {
  it("accepts public http and https URLs", () => {
    expect(validatePublicUrl("https://example.com/page")).toMatchObject({
      hostname: "example.com",
    });
  });

  it("rejects unsupported protocols and private hosts", () => {
    expect(validatePublicUrl("file:///etc/passwd")).toHaveProperty("error");
    expect(validatePublicUrl("http://localhost:3000")).toHaveProperty("error");
    expect(validatePublicUrl("http://192.168.1.20")).toHaveProperty("error");
  });

  it("enforces host allowlists", () => {
    expect(validatePublicUrl("https://github.com/openai", ["github.com"])).toHaveProperty(
      "url",
    );
    expect(validatePublicUrl("https://example.com/openai", ["github.com"])).toHaveProperty(
      "error",
    );
  });

  it("rejects oversized URLs", () => {
    expect(validatePublicUrl(`https://example.com/${"a".repeat(2_100)}`)).toHaveProperty(
      "error",
    );
  });
});

describe("validateFile", () => {
  it("accepts allowed extension and MIME combinations", () => {
    const file = new File(["hello"], "notes.md", {
      type: "text/markdown",
    });

    expect(validateFile(file, ["md"])).toHaveProperty("file", file);
  });

  it("rejects unsupported extensions, oversized files, and MIME mismatches", () => {
    const pdfAsText = new File(["%PDF-"], "paper.pdf", {
      type: "text/plain",
    });
    const unsupported = new File(["x"], "script.exe", {
      type: "application/octet-stream",
    });
    const oversized = new File(["x"], "large.txt", {
      type: "text/plain",
    });
    Object.defineProperty(oversized, "size", {
      value: MAX_UPLOAD_BYTES + 1,
    });

    expect(validateFile(pdfAsText, ["pdf"])).toHaveProperty("error");
    expect(validateFile(unsupported, ["txt"])).toHaveProperty("error");
    expect(validateFile(oversized, ["txt"])).toHaveProperty("error");
  });
});

describe("isAllowedUploadMimeType", () => {
  it("allows browser-generic MIME types only as a fallback", () => {
    expect(isAllowedUploadMimeType("pdf", "")).toBe(true);
    expect(isAllowedUploadMimeType("pdf", "application/octet-stream")).toBe(true);
    expect(isAllowedUploadMimeType("pdf", "text/plain")).toBe(false);
  });
});

describe("sanitizeSourcesForClient", () => {
  it("keeps safe metadata and drops non-string metadata values", () => {
    expect(
      sanitizeSourcesForClient([
        {
          id: "source-1",
          similarity: 0.8,
          metadata: {
            source: "pdf",
            name: 123,
            url: "https://example.com",
          },
        },
      ]),
    ).toEqual([
      {
        id: "source-1",
        similarity: 0.8,
        metadata: {
          source: "pdf",
          name: undefined,
          url: "https://example.com",
        },
      },
    ]);
  });
});
