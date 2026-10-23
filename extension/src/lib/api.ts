export type Entry = {
  id: number;
  name: string;
  message: string;
  createdAt: string;
};

export type EntryPage = {
  entries: Entry[];
  page: number;
  totalPages: number;
  totalElements: number;
};

export type ApiErrorCode = "BANNED_WORD" | "VALIDATION" | "SERVER" | "NETWORK";

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

import { API_BASE } from "./config";

const NETWORK_MESSAGE = "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";

async function request(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiError("NETWORK", NETWORK_MESSAGE);
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as { code?: string; message?: string };
    const code: ApiErrorCode =
      body.code === "BANNED_WORD" || body.code === "SERVER" ? body.code : "VALIDATION";
    return new ApiError(code, body.message ?? "요청을 처리하지 못했습니다.");
  } catch {
    return new ApiError("NETWORK", NETWORK_MESSAGE);
  }
}

export async function fetchEntries(params: { name?: string; page: number }): Promise<EntryPage> {
  const query = new URLSearchParams();
  if (params.name) {
    query.set("name", params.name);
  }
  query.set("page", String(params.page));

  const response = await request(`${API_BASE}/api/entries?${query.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw await toApiError(response);
  }
  return (await response.json()) as EntryPage;
}

export async function createEntry(input: { name: string; message: string }): Promise<Entry> {
  const response = await request(`${API_BASE}/api/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw await toApiError(response);
  }
  return (await response.json()) as Entry;
}
