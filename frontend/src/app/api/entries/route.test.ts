import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Entry, EntryRepository } from "@/lib/server/entries-repo";

vi.mock("@/lib/server/supabase-client", () => ({ getEntryRepository: vi.fn() }));
import { getEntryRepository } from "@/lib/server/supabase-client";
import { GET, POST } from "./route";

const getRepoMock = vi.mocked(getEntryRepository);

function memoryRepo() {
  const entries: Entry[] = [];
  const list = vi.fn(async (params: { name?: string; page: number; pageSize: number }) => {
    void params;
    return { entries: [...entries].reverse(), totalElements: entries.length };
  });
  const repo: EntryRepository = {
    async create(entry) {
      const saved = { id: entries.length + 1, ...entry, createdAt: "2026-10-22T03:00:00Z" };
      entries.push(saved);
      return saved;
    },
    list,
  };
  return { repo, entries, list };
}

function post(body: string) {
  return new NextRequest("http://localhost/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

let mem: ReturnType<typeof memoryRepo>;

beforeEach(() => {
  mem = memoryRepo();
  getRepoMock.mockReset();
  getRepoMock.mockReturnValue(mem.repo);
  delete process.env.BANNED_WORDS;
});

describe("POST /api/entries", () => {
  it("creates an entry and returns 201", async () => {
    const response = await POST(post(JSON.stringify({ name: "민수", message: "안녕" })));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id: 1, name: "민수", message: "안녕" });
  });

  it("returns 400 VALIDATION for a body that is not valid JSON", async () => {
    const response = await POST(post("{"));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "VALIDATION" });
    expect(mem.entries).toHaveLength(0);
  });

  it("returns 400 VALIDATION for fields that are not strings", async () => {
    const response = await POST(post(JSON.stringify({ name: 1, message: ["x"] })));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "VALIDATION" });
  });

  it("uses the BANNED_WORDS environment variable", async () => {
    process.env.BANNED_WORDS = "금지, 비속어";

    const response = await POST(post(JSON.stringify({ name: "민수", message: "이건 비 속 어" })));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "BANNED_WORD" });
  });

  it("returns 500 SERVER as JSON when the database is not configured", async () => {
    getRepoMock.mockImplementation(() => {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    });

    const response = await POST(post(JSON.stringify({ name: "민수", message: "안녕" })));

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ code: "SERVER" });
  });
});

describe("GET /api/entries", () => {
  it("passes page and name to the repository", async () => {
    const response = await GET(new NextRequest("http://localhost/api/entries?page=1&name=a"));

    expect(response.status).toBe(200);
    expect(mem.list).toHaveBeenCalledWith({ name: "a", page: 1, pageSize: 20 });
  });

  it("returns 400 VALIDATION for a negative page", async () => {
    const response = await GET(new NextRequest("http://localhost/api/entries?page=-1"));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "VALIDATION" });
  });

  it("returns 500 SERVER as JSON when the database is not configured", async () => {
    getRepoMock.mockImplementation(() => {
      throw new Error("missing env");
    });

    const response = await GET(new NextRequest("http://localhost/api/entries"));

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ code: "SERVER" });
  });
});
