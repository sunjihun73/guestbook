import { Card, CardContent } from "@/components/ui/card";
import type { Entry } from "@/lib/api";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export function EntryList({ entries, isSearch }: { entries: Entry[]; isSearch: boolean }) {
  if (entries.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {isSearch ? "검색 결과가 없습니다." : "아직 남겨진 글이 없습니다."}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Card size="sm">
            <CardContent className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{entry.name}</span>
                <time dateTime={entry.createdAt} className="text-xs text-muted-foreground">
                  {formatTime(entry.createdAt)}
                </time>
              </div>
              <p className="break-words">{entry.message}</p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
