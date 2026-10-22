import { describe, expect, it } from "vitest";
import { createSupabaseEntryRepository, escapeLike, type SupabaseClientLike } from "./entries-repo";

type Call = [method: string, ...args: unknown[]];

/** Records every query-builder call; resolves with `result` when awaited. */
function fakeClient(result: { data: unknown; error: { message: string } | null; count?: number | null }) {
  const calls: Call[] = [];
  const builder: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  for (const method of ["select", "insert", "ilike", "order", "range", "single"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, ...args]);
      return builder;
    };
  }
  const client = {
    from: (table: string) => {
      calls.push(["from", table]);
      return builder;
    },
  } as unknown as SupabaseClientLike;
  return { client, calls };
}

const row = { id: 7, name: "민수", message: "안녕", created_at: "2026-10-22T03:00:00+00:00" };

describe("create", () => {
  it("inserts name and message and maps created_at to createdAt", async () => {
    const { client, calls } = fakeClient({ data: row, error: null });

    const entry = await createSupabaseEntryRepository(client).create({ name: "민수", message: "안녕" });

    expect(calls).toEqual([
      ["from", "entries"],
      ["insert", { name: "민수", message: "안녕" }],
      ["select"],
      ["single"],
    ]);
    expect(entry).toEqual({ id: 7, name: "민수", message: "안녕", createdAt: "2026-10-22T03:00:00+00:00" });
  });

  it("throws when supabase reports an error", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } });

    await expect(createSupabaseEntryRepository(client).create({ name: "a", message: "b" })).rejects.toThrow("boom");
  });
});

describe("list", () => {
  it("orders newest first and ranges by page", async () => {
    const { client, calls } = fakeClient({ data: [row], error: null, count: 41 });

    const result = await createSupabaseEntryRepository(client).list({ page: 2, pageSize: 20 });

    expect(calls).toEqual([
      ["from", "entries"],
      ["select", "*", { count: "exact" }],
      ["order", "created_at", { ascending: false }],
      ["order", "id", { ascending: false }],
      ["range", 40, 59],
    ]);
    expect(result.totalElements).toBe(41);
    expect(result.entries[0].createdAt).toBe(row.created_at);
  });

  it("filters by name with an escaped, case-insensitive partial match", async () => {
    const { client, calls } = fakeClient({ data: [], error: null, count: 0 });

    await createSupabaseEntryRepository(client).list({ name: "100%_a", page: 0, pageSize: 20 });

    expect(calls).toContainEqual(["ilike", "name", "%100\\%\\_a%"]);
  });

  it("does not filter when there is no name", async () => {
    const { client, calls } = fakeClient({ data: [], error: null, count: 0 });

    await createSupabaseEntryRepository(client).list({ page: 0, pageSize: 20 });

    expect(calls.some(([method]) => method === "ilike")).toBe(false);
  });

  it("throws when supabase reports an error", async () => {
    const { client } = fakeClient({ data: null, error: { message: "down" } });

    await expect(createSupabaseEntryRepository(client).list({ page: 0, pageSize: 20 })).rejects.toThrow("down");
  });
});

describe("escapeLike", () => {
  it("escapes backslash, percent and underscore", () => {
    expect(escapeLike("100%_a\\")).toBe("100\\%\\_a\\\\");
  });
});
