import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntryList } from "./EntryList";

const entry = (id: number, message: string) => ({
  id,
  name: "민수",
  message,
  createdAt: "2026-10-22T03:00:00Z",
});

describe("EntryList", () => {
  it("shows name and message of each entry", () => {
    render(<EntryList entries={[entry(1, "첫 글"), entry(2, "둘째 글")]} isSearch={false} />);

    expect(screen.getByText("첫 글")).toBeInTheDocument();
    expect(screen.getByText("둘째 글")).toBeInTheDocument();
    expect(screen.getAllByText("민수")).toHaveLength(2);
  });

  it("renders HTML in a message as plain text", () => {
    const { container } = render(
      <EntryList entries={[entry(1, "<script>alert(1)</script>")]} isSearch={false} />,
    );

    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
  });

  it("shows an empty message when there are no entries", () => {
    render(<EntryList entries={[]} isSearch={false} />);
    expect(screen.getByText("아직 남겨진 글이 없습니다.")).toBeInTheDocument();
  });

  it("shows a different empty message while searching", () => {
    render(<EntryList entries={[]} isSearch />);
    expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
  });
});
