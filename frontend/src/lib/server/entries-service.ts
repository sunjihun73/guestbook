import type { Entry, EntryRepository } from "./entries-repo";
import { stripEdges } from "./text";
import { validateNewEntry } from "./validation";

export const PAGE_SIZE = 20;

export type EntryPageResponse = { entries: Entry[]; page: number; totalPages: number; totalElements: number };

type ErrorBody = { code: "BANNED_WORD" | "VALIDATION" | "SERVER"; message: string };

export type ServiceResult<T> = { status: 200 | 201; body: T } | { status: 400 | 500; body: ErrorBody };

const BANNED: ServiceResult<never> = {
  status: 400,
  body: { code: "BANNED_WORD", message: "사용할 수 없는 단어가 포함되어 있습니다." },
};
const INVALID_ENTRY: ServiceResult<never> = {
  status: 400,
  body: { code: "VALIDATION", message: "이름은 1~20자, 메시지는 한 줄 1~300자로 입력해 주세요." },
};
const INVALID_REQUEST: ServiceResult<never> = {
  status: 400,
  body: { code: "VALIDATION", message: "요청 값이 올바르지 않습니다." },
};
const SERVER_ERROR: ServiceResult<never> = {
  status: 500,
  body: { code: "SERVER", message: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
};

function parsePage(raw: string | null): number | null {
  if (raw === null) {
    return 0;
  }
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  const page = Number(raw);
  return Number.isSafeInteger(page) ? page : null;
}

export function createEntriesService(deps: { repo: EntryRepository; isBanned: (text: string) => boolean }) {
  return {
    async create(body: unknown): Promise<ServiceResult<Entry>> {
      const validation = validateNewEntry(body);
      if (!validation.ok) {
        return INVALID_ENTRY;
      }
      const { name, message } = validation.value;
      if (deps.isBanned(name) || deps.isBanned(message)) {
        return BANNED;
      }
      try {
        return { status: 201, body: await deps.repo.create(validation.value) };
      } catch {
        return SERVER_ERROR;
      }
    },

    async list(query: { name: string | null; page: string | null }): Promise<ServiceResult<EntryPageResponse>> {
      const page = parsePage(query.page);
      if (page === null) {
        return INVALID_REQUEST;
      }
      const name = query.name === null ? "" : stripEdges(query.name);
      try {
        const { entries, totalElements } = await deps.repo.list({
          name: name === "" ? undefined : name,
          page,
          pageSize: PAGE_SIZE,
        });
        return {
          status: 200,
          body: { entries, page, totalPages: Math.ceil(totalElements / PAGE_SIZE), totalElements },
        };
      } catch {
        return SERVER_ERROR;
      }
    },
  };
}
