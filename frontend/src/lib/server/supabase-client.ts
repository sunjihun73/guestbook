import { createClient } from "@supabase/supabase-js";
import { createSupabaseEntryRepository, type EntryRepository, type SupabaseClientLike } from "./entries-repo";

let repository: EntryRepository | undefined;

/**
 * Server-only: uses the service role key, which bypasses RLS. Never expose these variables to the browser
 * (no NEXT_PUBLIC_ prefix) and never import this module from a client component.
 */
export function getEntryRepository(): EntryRepository {
  if (!repository) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    repository = createSupabaseEntryRepository(client as unknown as SupabaseClientLike);
  }
  return repository;
}
