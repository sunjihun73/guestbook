import { describe, expect, it } from "vitest";
import { removeAll, stripEdges } from "./text";

describe("stripEdges", () => {
  it("removes unicode spaces around the text", () => {
    expect(stripEdges("　a ")).toBe("a");
    expect(stripEdges("  가 나  ")).toBe("가 나");
  });
});

describe("removeAll", () => {
  it("removes tabs, spaces and zero-width characters everywhere", () => {
    expect(removeAll("b\ta​d")).toBe("bad");
    expect(removeAll("욕 　설")).toBe("욕설");
  });
});
