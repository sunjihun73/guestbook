import { describe, expect, it } from "vitest";
import { validateNewEntry } from "./validation";

const valid = { name: "민수", message: "안녕하세요" };

describe("validateNewEntry", () => {
  it("accepts a normal entry and trims it", () => {
    expect(validateNewEntry({ name: "  민수　", message: " 안녕 " })).toEqual({
      ok: true,
      value: { name: "민수", message: "안녕" },
    });
  });

  it.each([["   "], ["　"], ["  "], [""]])("rejects a blank name %j", (name) => {
    expect(validateNewEntry({ ...valid, name })).toEqual({ ok: false });
  });

  it.each([["   "], ["　"], ["  "], [""]])("rejects a blank message %j", (message) => {
    expect(validateNewEntry({ ...valid, message })).toEqual({ ok: false });
  });

  it("limits the name to 20 characters", () => {
    expect(validateNewEntry({ ...valid, name: "가".repeat(20) }).ok).toBe(true);
    expect(validateNewEntry({ ...valid, name: "가".repeat(21) }).ok).toBe(false);
  });

  it("limits the message to 300 characters", () => {
    expect(validateNewEntry({ ...valid, message: "가".repeat(300) }).ok).toBe(true);
    expect(validateNewEntry({ ...valid, message: "가".repeat(301) }).ok).toBe(false);
  });

  it("rejects line breaks inside the message", () => {
    expect(validateNewEntry({ ...valid, message: "첫 줄\n둘째 줄" }).ok).toBe(false);
    expect(validateNewEntry({ ...valid, message: "첫 줄\r둘째 줄" }).ok).toBe(false);
  });

  it("rejects bodies that are not an object with string fields", () => {
    for (const body of [null, undefined, "text", 42, [], { name: 1, message: "x" }, { name: "a" }, { message: "x" }, { name: ["a"], message: "x" }]) {
      expect(validateNewEntry(body)).toEqual({ ok: false });
    }
  });
});
