import { stripEdges } from "./text";

export const NAME_MAX = 20;
export const MESSAGE_MAX = 300;

export type NewEntry = { name: string; message: string };

export type ValidationResult = { ok: true; value: NewEntry } | { ok: false };

const LINE_BREAK = /[\r\n]/;

export function validateNewEntry(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false };
  }
  const { name, message } = body as Record<string, unknown>;
  if (typeof name !== "string" || typeof message !== "string") {
    return { ok: false };
  }
  const trimmedName = stripEdges(name);
  const trimmedMessage = stripEdges(message);
  if (
    trimmedName === "" ||
    trimmedMessage === "" ||
    trimmedName.length > NAME_MAX ||
    trimmedMessage.length > MESSAGE_MAX ||
    LINE_BREAK.test(trimmedMessage)
  ) {
    return { ok: false };
  }
  return { ok: true, value: { name: trimmedName, message: trimmedMessage } };
}
