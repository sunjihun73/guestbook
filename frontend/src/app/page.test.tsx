import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  fetchEntries: vi.fn(),
  createEntry: vi.fn(),
}));
import { ApiError, createEntry, fetchEntries } from "@/lib/api";

const fetchEntriesMock = vi.mocked(fetchEntries);
const createEntryMock = vi.mocked(createEntry);

const pageOf = (messages: string[], page = 0, totalPages = 1) => ({
  entries: messages.map((message, i) => ({
    id: i + 1,
    name: "민수",
    message,
    createdAt: "2026-10-22T03:00:00Z",
  })),
  page,
  totalPages,
  totalElements: messages.length,
});

beforeEach(() => {
  fetchEntriesMock.mockReset();
  createEntryMock.mockReset();
  fetchEntriesMock.mockResolvedValue(pageOf(["첫 글"]));
});

describe("guestbook page", () => {
  it("loads the first page on render", async () => {
    render(<Page />);

    expect(await screen.findByText("첫 글")).toBeInTheDocument();
    expect(fetchEntriesMock).toHaveBeenCalledWith({ name: undefined, page: 0 });
  });

  it("searches by name starting from page 0", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await screen.findByText("첫 글");

    await user.type(screen.getByRole("searchbox"), "민수");
    await user.click(screen.getByRole("button", { name: "검색" }));

    await vi.waitFor(() =>
      expect(fetchEntriesMock).toHaveBeenLastCalledWith({ name: "민수", page: 0 }),
    );
  });

  it("requests the clicked page", async () => {
    const user = userEvent.setup();
    fetchEntriesMock.mockResolvedValue(pageOf(["첫 글"], 0, 3));
    render(<Page />);
    await screen.findByText("첫 글");

    await user.click(screen.getByRole("button", { name: "2" }));

    await vi.waitFor(() =>
      expect(fetchEntriesMock).toHaveBeenLastCalledWith({ name: undefined, page: 1 }),
    );
  });

  it("reloads the list after a new entry is created", async () => {
    const user = userEvent.setup();
    createEntryMock.mockResolvedValue({ id: 9, name: "영희", message: "새 글", createdAt: "" });
    render(<Page />);
    await screen.findByText("첫 글");
    fetchEntriesMock.mockResolvedValue(pageOf(["새 글", "첫 글"]));

    await user.type(screen.getByLabelText("이름"), "영희");
    await user.type(screen.getByLabelText("메시지"), "새 글");
    await user.click(screen.getByRole("button", { name: "남기기" }));

    expect(await screen.findByText("새 글")).toBeInTheDocument();
    expect(fetchEntriesMock).toHaveBeenCalledTimes(2);
  });

  it("shows an error when the list cannot be loaded", async () => {
    fetchEntriesMock.mockRejectedValue(new ApiError("NETWORK", "서버에 연결할 수 없습니다."));
    render(<Page />);

    expect(await screen.findByRole("alert")).toHaveTextContent("서버에 연결할 수 없습니다.");
  });
});
