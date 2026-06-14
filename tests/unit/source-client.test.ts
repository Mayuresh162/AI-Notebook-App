import { uploadSourceFile } from "@/lib/api/source-client";

describe("source-client uploads", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("uses the direct PDF upload route for PDFs", async () => {
    await uploadSourceFile(
      new File(["pdf"], "guide.pdf", { type: "application/pdf" }),
      {
        headers: {
          Authorization: "Bearer token",
        },
      },
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/upload",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("uses the direct filesystem route for non-PDF source files", async () => {
    await uploadSourceFile(
      new File(["# Notes"], "notes.md", { type: "text/markdown" }),
      {
        headers: {
          Authorization: "Bearer token",
        },
      },
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/filesystem",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
