import type { NewEntry } from "./validation";

export type Entry = { id: number; name: string; message: string; createdAt: string };

export interface EntryRepository {
  create(entry: NewEntry): Promise<Entry>;
  list(params: { name?: string; page: number; pageSize: number }): Promise<{ entries: Entry[]; totalElements: number }>;
}

type QueryResult = { data: unknown; error: { message: string } | null; count?: number | null };

/** The subset of the supabase-js query builder this repository uses. */
export interface Query extends PromiseLike<QueryResult> {
  select(columns?: string, options?: { count: "exact" }): Query;
  insert(values: Record<string, unknown>): Query;
  ilike(column: string, pattern: string): Query;
  order(column: string, options: { ascending: boolean }): Query;
  range(from: number, to: number): Query;
  single(): Query;
}

export type SupabaseClientLike = { from(table: string): Query };

type Row = { id: number; name: string; message: string; created_at: string };

function toEntry(row: Row): Entry {
  return { id: row.id, name: row.name, message: row.message, createdAt: row.created_at };
}

/** Makes `\`, `%` and `_` match literally inside a LIKE/ILIKE pattern. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function createSupabaseEntryRepository(client: SupabaseClientLike): EntryRepository {
  return {
    async create(entry) {
      const { data, error } = await client.from("entries").insert({ name: entry.name, message: entry.message }).select().single();
      if (error) {
        throw new Error(error.message);
      }
      return toEntry(data as Row);
    },

    async list({ name, page, pageSize }) {
      let query = client.from("entries").select("*", { count: "exact" });
      if (name) {
        query = query.ilike("name", `%${escapeLike(name)}%`);
      }
      const from = page * pageSize;
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) {
        throw new Error(error.message);
      }
      return { entries: ((data ?? []) as Row[]).map(toEntry), totalElements: count ?? 0 };
    },
  };
}
