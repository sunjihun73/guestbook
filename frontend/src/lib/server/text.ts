// Unicode spaces (full-width space, no-break space, tabs) and zero-width characters.
const SPACE_OR_INVISIBLE = "[\\p{Z}\\s\\u200B-\\u200D\\uFEFF]";
const EDGES = new RegExp(`^${SPACE_OR_INVISIBLE}+|${SPACE_OR_INVISIBLE}+$`, "gu");
const ANY = new RegExp(`${SPACE_OR_INVISIBLE}+`, "gu");

/** Removes leading and trailing spaces, including Unicode ones that String.trim() misses. */
export function stripEdges(text: string): string {
  return text.replace(EDGES, "");
}

/** Removes every space and invisible character. */
export function removeAll(text: string): string {
  return text.replace(ANY, "");
}
