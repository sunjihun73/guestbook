import { describe, expect, it } from "vitest";
import { normalizeApiBase } from "./api-base";
import { API_BASE } from "./config";

describe("normalizeApiBase", () => {
  it("removes trailing slashes", () => {
    expect(normalizeApiBase("https://a.vercel.app///")).toBe("https://a.vercel.app");
  });

  it("rejects a missing value", () => {
    expect(() => normalizeApiBase(undefined)).toThrow(/VITE_API_BASE/);
    expect(() => normalizeApiBase("  ")).toThrow(/VITE_API_BASE/);
  });

  it("rejects a value that is not an http(s) origin", () => {
    expect(() => normalizeApiBase("guestbook.vercel.app")).toThrow(/VITE_API_BASE/);
  });
});

describe("API_BASE", () => {
  it("comes from VITE_API_BASE", () => {
    expect(API_BASE).toBe("https://guestbook.test");
  });
});
