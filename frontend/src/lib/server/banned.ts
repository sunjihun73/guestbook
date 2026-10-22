import { removeAll } from "./text";

const DEFAULT_BANNED_WORDS = ["욕설", "badword"];

function normalize(text: string): string {
  return removeAll(text.toLowerCase());
}

export function createBannedWordFilter(words: string[]): (text: string | null | undefined) => boolean {
  const normalizedWords = words.map(normalize).filter((word) => word !== "");
  return (text) => {
    if (!text) {
      return false;
    }
    const normalized = normalize(text);
    return normalizedWords.some((word) => normalized.includes(word));
  };
}

/** Comma-separated list (BANNED_WORDS). Unset falls back to placeholders; a blank value means no banned words. */
export function parseBannedWords(raw: string | undefined): string[] {
  if (raw === undefined) {
    return DEFAULT_BANNED_WORDS;
  }
  return raw
    .split(",")
    .map((word) => word.trim())
    .filter((word) => word !== "");
}
