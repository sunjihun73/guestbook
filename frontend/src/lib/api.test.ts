import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createEntry, fetchEntries } from "./api";

function jsonResponse(status: number, body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchEntries", () => {
  it("calls /api/entries with name and page", async () => {
    const fetchMock = vi.fn(() =>
      jsonResponse(200, { entries: [], page: 1, totalPages: 2, totalElements: 21 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchEntries({ name: "민수", page: 1 });

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/entries?name=${encodeURIComponent("민수")}&page=1`,
      expect.anything(),
    );
    expect(result.totalPages).toBe(2);
  });

  it("omits the name parameter when there is no name", async () => {
    const fetchMock = vi.fn(() =>
      jsonResponse(200, { entries: [], page: 0, totalPages: 0, totalElements: 0 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchEntries({ page: 0 });

    expect((fetchMock.mock.calls[0] as unknown[])[0]).toBe("/api/entries?page=0");
  });

  it("url-encodes the name", async () => {
    const fetchMock = vi.fn(() =>
      jsonResponse(200, { entries: [], page: 0, totalPages: 0, totalElements: 0 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchEntries({ name: "a&b", page: 0 });

    expect((fetchMock.mock.calls[0] as unknown[])[0]).toBe("/api/entries?name=a%26b&page=0");
  });
});

describe("createEntry", () => {
  it("posts name and message as JSON and returns the created entry", async () => {
    const created = { id: 1, name: "민수", message: "안녕", createdAt: "2026-10-22T00:00:00Z" };
    const fetchMock = vi.fn(() => jsonResponse(201, created));
    vi.stubGlobal("fetch", fetchMock);

    const result = await createEntry({ name: "민수", message: "안녕" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/entries");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ name: "민수", message: "안녕" });
    expect(result).toEqual(created);
  });

  it("throws ApiError with the server's code on 400", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        jsonResponse(400, { code: "BANNED_WORD", message: "사용할 수 없는 단어가 포함되어 있습니다." }),
      ),
    );

    const error = await createEntry({ name: "민수", message: "욕설" }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("BANNED_WORD");
    expect(error.message).toBe("사용할 수 없는 단어가 포함되어 있습니다.");
  });

  it("throws ApiError with code NETWORK when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));

    const error = await createEntry({ name: "민수", message: "안녕" }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("NETWORK");
  });
});
