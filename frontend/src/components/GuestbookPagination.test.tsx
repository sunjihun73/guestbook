import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GuestbookPagination } from "./GuestbookPagination";

describe("GuestbookPagination", () => {
  it("renders nothing when there is only one page", () => {
    const { container } = render(<GuestbookPagination page={0} totalPages={1} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("reports the zero-based index of the clicked page number", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GuestbookPagination page={0} totalPages={3} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "2" }));

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("moves to the next and previous page", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GuestbookPagination page={1} totalPages={3} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /다음/ }));
    await user.click(screen.getByRole("button", { name: /이전/ }));

    expect(onChange).toHaveBeenNthCalledWith(1, 2);
    expect(onChange).toHaveBeenNthCalledWith(2, 0);
  });

  it("does not go before the first or after the last page", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<GuestbookPagination page={0} totalPages={2} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /이전/ }));
    rerender(<GuestbookPagination page={1} totalPages={2} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /다음/ }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
