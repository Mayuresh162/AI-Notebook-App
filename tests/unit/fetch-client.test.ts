import {
  apiJsonRequest,
  getAuthHeaders,
} from "@/lib/api/fetch-client";

describe("fetch client", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("converts auth config headers into Headers", () => {
    const headers = getAuthHeaders({
      headers: {
        Authorization: "Bearer token",
      },
    });

    expect(headers.get("Authorization")).toBe("Bearer token");
  });

  it("sends JSON requests and returns parsed JSON", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        ok: true,
      }),
    );

    await expect(
      apiJsonRequest<{ ok: boolean }>(
        "/api/example",
        {
          headers: {
            Authorization: "Bearer token",
          },
        },
        {
          method: "POST",
          body: {
            name: "Notebook",
          },
        },
      ),
    ).resolves.toEqual({
      ok: true,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/example", {
      method: "POST",
      headers: expect.any(Headers),
      body: JSON.stringify({
        name: "Notebook",
      }),
    });
  });

  it("throws typed API errors with status", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      ),
    );

    await expect(
      apiJsonRequest("/api/example", {
        headers: {},
      }),
    ).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
  });
});
