import { describe, expect, it } from "vitest";
import { createBannedWordFilter, parseBannedWords } from "./banned";

const isBanned = createBannedWordFilter(["badword", "욕설"]);

describe("createBannedWordFilter", () => {
  it("detects a banned word inside text", () => {
    expect(isBanned("this has badword inside")).toBe(true);
    expect(isBanned("좋은 하루")).toBe(false);
  });

  it("ignores case", () => {
    expect(isBanned("BadWord")).toBe(true);
  });

  it.each([
    ["b a d w o r d"],
    ["욕 설"],
    ["bad\tword"],
    ["욕　설"],
    ["bad word"],
    ["bad​word"],
    ["욕﻿설"],
  ])("detects %j split by spaces or invisible characters", (text) => {
    expect(isBanned(text)).toBe(true);
  });

  it("treats null, undefined and empty text as clean", () => {
    expect(isBanned(null)).toBe(false);
    expect(isBanned(undefined)).toBe(false);
    expect(isBanned("")).toBe(false);
  });

  it("does not ban everything when the word list only has blanks", () => {
    const blankOnly = createBannedWordFilter(["", "  ", "　"]);
    expect(blankOnly("아무 말")).toBe(false);
  });
});

describe("parseBannedWords", () => {
  it("falls back to the placeholder list when unset", () => {
    expect(parseBannedWords(undefined)).toEqual(["욕설", "badword"]);
  });

  it("splits on commas and drops blanks", () => {
    expect(parseBannedWords(" a , b ,,")).toEqual(["a", "b"]);
  });

  it("returns an empty list for a blank value instead of the placeholders", () => {
    expect(parseBannedWords("  ")).toEqual([]);
  });
});
