import { beforeEach, describe, expect, it } from "vitest";
import { createBannedWordFilter } from "./banned";
import { createEntriesService } from "./entries-service";
import type { Entry, EntryRepository } from "./entries-repo";

function memoryRepo() {
  const entries: Entry[] = [];
  const calls: { name?: string; page: number; pageSize: number }[] = [];
  const repo: EntryRepository = {
    async create(entry) {
      const saved = { id: entries.length + 1, ...entry, createdAt: "2026-10-22T03:00:00Z" };
      entries.push(saved);
      return saved;
    },
    async list(params) {
      calls.push(params);
      const filtered = params.name ? entries.filter((e) => e.name.includes(params.name!)) : entries;
      const newestFirst = [...filtered].reverse();
      const start = params.page * params.pageSize;
      return { entries: newestFirst.slice(start, start + params.pageSize), totalElements: filtered.length };
    },
  };
  return { repo, entries, calls };
}

let mem: ReturnType<typeof memoryRepo>;
let service: ReturnType<typeof createEntriesService>;

beforeEach(() => {
  mem = memoryRepo();
  service = createEntriesService({ repo: mem.repo, isBanned: createBannedWordFilter(["욕설"]) });
});

describe("create", () => {
  it("returns 201 and stores a valid entry", async () => {
    const result = await service.create({ name: "민수", message: "안녕" });

    expect(result.status).toBe(201);
    expect(result.body).toMatchObject({ name: "민수", message: "안녕" });
    expect(mem.entries).toHaveLength(1);
  });

  it.each([
    [{ name: "민수", message: "이건 욕 설 입니다" }],
    [{ name: "욕설맨", message: "안녕" }],
  ])("rejects banned words with BANNED_WORD and stores nothing: %j", async (body) => {
    const result = await service.create(body);

    expect(result).toEqual({
      status: 400,
      body: { code: "BANNED_WORD", message: "사용할 수 없는 단어가 포함되어 있습니다." },
    });
    expect(mem.entries).toHaveLength(0);
  });

  it("rejects invalid input with VALIDATION and stores nothing", async () => {
    const result = await service.create({ name: "   ", message: "안녕" });

    expect(result).toEqual({
      status: 400,
      body: { code: "VALIDATION", message: "이름은 1~20자, 메시지는 한 줄 1~300자로 입력해 주세요." },
    });
    expect(mem.entries).toHaveLength(0);
  });

  it("returns 500 SERVER when the repository throws", async () => {
    const broken = createEntriesService({
      repo: { ...mem.repo, create: async () => Promise.reject(new Error("db down")) },
      isBanned: () => false,
    });

    const result = await broken.create({ name: "민수", message: "안녕" });

    expect(result.status).toBe(500);
    expect(result.body).toMatchObject({ code: "SERVER" });
  });
});

describe("list", () => {
  async function seed(name: string, count: number) {
    for (let i = 1; i <= count; i++) {
      await mem.repo.create({ name, message: `메시지 ${i}` });
    }
  }

  it("defaults to page 0 with 20 entries per page and newest first", async () => {
    await seed("민수", 25);

    const result = await service.list({ name: null, page: null });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ page: 0, totalPages: 2, totalElements: 25 });
    expect((result.body as { entries: Entry[] }).entries).toHaveLength(20);
    expect((result.body as { entries: Entry[] }).entries[0].message).toBe("메시지 25");
    expect(mem.calls[0].pageSize).toBe(20);
  });

  it("returns the second page with the remaining entries", async () => {
    await seed("민수", 25);

    const result = await service.list({ name: null, page: "1" });

    expect((result.body as { entries: Entry[] }).entries).toHaveLength(5);
    expect(result.body).toMatchObject({ page: 1 });
  });

  it("returns an empty list for a page beyond the last one", async () => {
    await seed("민수", 3);

    const result = await service.list({ name: null, page: "5" });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ entries: [], totalElements: 3, totalPages: 1 });
  });

  it.each([["-1"], ["abc"], ["1.5"], [""], ["99999999999999999999"]])("rejects page %j with VALIDATION", async (page) => {
    const result = await service.list({ name: null, page });

    expect(result).toEqual({ status: 400, body: { code: "VALIDATION", message: "요청 값이 올바르지 않습니다." } });
  });

  it("passes a trimmed name to the repository and ignores a blank name", async () => {
    await service.list({ name: "  민수 ", page: null });
    await service.list({ name: "  　 ", page: null });

    expect(mem.calls[0].name).toBe("민수");
    expect(mem.calls[1].name).toBeUndefined();
  });

  it("returns 500 SERVER when the repository throws", async () => {
    const broken = createEntriesService({
      repo: { ...mem.repo, list: async () => Promise.reject(new Error("db down")) },
      isBanned: () => false,
    });

    const result = await broken.list({ name: null, page: null });

    expect(result.status).toBe(500);
    expect(result.body).toMatchObject({ code: "SERVER" });
  });
});
