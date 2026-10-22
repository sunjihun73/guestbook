import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { EntryForm } from "./EntryForm";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  createEntry: vi.fn(),
}));
import { createEntry } from "@/lib/api";

const createEntryMock = vi.mocked(createEntry);

beforeEach(() => {
  createEntryMock.mockReset();
});

describe("EntryForm", () => {
  it("does not submit when name or message is blank", async () => {
    const user = userEvent.setup();
    render(<EntryForm onCreated={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "남기기" }));
    await user.type(screen.getByLabelText("이름"), "민수");
    await user.click(screen.getByRole("button", { name: "남기기" }));

    expect(createEntryMock).not.toHaveBeenCalled();
  });

  it("submits trimmed values, clears the inputs and notifies the parent", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    createEntryMock.mockResolvedValue({ id: 1, name: "민수", message: "안녕", createdAt: "" });
    render(<EntryForm onCreated={onCreated} />);

    await user.type(screen.getByLabelText("이름"), " 민수 ");
    await user.type(screen.getByLabelText("메시지"), "안녕");
    await user.click(screen.getByRole("button", { name: "남기기" }));

    expect(createEntryMock).toHaveBeenCalledWith({ name: "민수", message: "안녕" });
    await vi.waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("이름")).toHaveValue("");
    expect(screen.getByLabelText("메시지")).toHaveValue("");
  });

  it("shows the banned word message and keeps the input", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    createEntryMock.mockRejectedValue(
      new ApiError("BANNED_WORD", "사용할 수 없는 단어가 포함되어 있습니다."),
    );
    render(<EntryForm onCreated={onCreated} />);

    await user.type(screen.getByLabelText("이름"), "민수");
    await user.type(screen.getByLabelText("메시지"), "나쁜말");
    await user.click(screen.getByRole("button", { name: "남기기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "사용할 수 없는 단어가 포함되어 있습니다.",
    );
    expect(screen.getByLabelText("메시지")).toHaveValue("나쁜말");
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("shows how many of the 300 characters are used", async () => {
    const user = userEvent.setup();
    render(<EntryForm onCreated={vi.fn()} />);

    expect(screen.getByText("0/300")).toBeInTheDocument();
    await user.type(screen.getByLabelText("메시지"), "abc");

    expect(screen.getByText("3/300")).toBeInTheDocument();
  });

  it("limits the inputs to 20 and 300 characters", () => {
    render(<EntryForm onCreated={vi.fn()} />);

    expect(screen.getByLabelText("이름")).toHaveAttribute("maxlength", "20");
    expect(screen.getByLabelText("메시지")).toHaveAttribute("maxlength", "300");
  });
});
