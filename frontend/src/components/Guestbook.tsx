"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EntryForm } from "@/components/EntryForm";
import { EntryList } from "@/components/EntryList";
import { GuestbookPagination } from "@/components/GuestbookPagination";
import { SearchBar } from "@/components/SearchBar";
import { ApiError, fetchEntries, type EntryPage } from "@/lib/api";

function parsePage(raw: string | null): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function syncUrl(name: string, page: number) {
  const query = new URLSearchParams();
  if (name) {
    query.set("name", name);
  }
  if (page > 0) {
    query.set("page", String(page));
  }
  const search = query.toString();
  window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
}

export function Guestbook() {
  const searchParams = useSearchParams();
  const [name, setName] = useState(searchParams.get("name") ?? "");
  const [page, setPage] = useState(parsePage(searchParams.get("page")));
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<EntryPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchEntries({ name: name || undefined, page })
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "목록을 불러오지 못했습니다.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [name, page, reloadKey]);

  function move(nextName: string, nextPage: number) {
    setName(nextName);
    setPage(nextPage);
    syncUrl(nextName, nextPage);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">방명록</h1>
        <p className="text-sm text-muted-foreground">한마디를 남기고 다른 사람의 글을 읽어 보세요.</p>
      </header>
      <EntryForm
        onCreated={() => {
          move("", 0);
          setReloadKey((key) => key + 1);
        }}
      />
      <SearchBar key={name} initialName={name} onSearch={(next) => move(next, 0)} />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {data && <EntryList entries={data.entries} isSearch={name !== ""} />}
      {data && (
        <GuestbookPagination
          page={page}
          totalPages={data.totalPages}
          onChange={(next) => move(name, next)}
        />
      )}
    </main>
  );
}
