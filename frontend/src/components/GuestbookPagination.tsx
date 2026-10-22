"use client";

import type { MouseEvent } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const WINDOW = 2;

export function GuestbookPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const first = Math.max(0, page - WINDOW);
  const last = Math.min(totalPages - 1, page + WINDOW);
  const pages = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  function go(target: number) {
    return (event: MouseEvent) => {
      event.preventDefault();
      if (target >= 0 && target < totalPages && target !== page) {
        onChange(target);
      }
    };
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            text="이전"
            aria-label="이전 페이지"
            aria-disabled={page === 0}
            onClick={go(page - 1)}
          />
        </PaginationItem>
        {pages.map((p) => (
          <PaginationItem key={p}>
            <PaginationLink isActive={p === page} onClick={go(p)}>
              {p + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            text="다음"
            aria-label="다음 페이지"
            aria-disabled={page === totalPages - 1}
            onClick={go(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
