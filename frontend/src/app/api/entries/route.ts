import type { NextRequest } from "next/server";
import { createBannedWordFilter, parseBannedWords } from "@/lib/server/banned";
import { createEntriesService, type ServiceResult } from "@/lib/server/entries-service";
import { getEntryRepository } from "@/lib/server/supabase-client";

const SERVER_ERROR = {
  code: "SERVER",
  message: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
};

function buildService() {
  return createEntriesService({
    repo: getEntryRepository(),
    isBanned: createBannedWordFilter(parseBannedWords(process.env.BANNED_WORDS)),
  });
}

function respond(result: ServiceResult<unknown>) {
  return Response.json(result.body, { status: result.status });
}

export async function GET(request: NextRequest) {
  let service;
  try {
    service = buildService();
  } catch {
    return Response.json(SERVER_ERROR, { status: 500 });
  }
  const params = request.nextUrl.searchParams;
  return respond(await service.list({ name: params.get("name"), page: params.get("page") }));
}

export async function POST(request: NextRequest) {
  let service;
  try {
    service = buildService();
  } catch {
    return Response.json(SERVER_ERROR, { status: 500 });
  }
  const body: unknown = await request.json().catch(() => undefined);
  return respond(await service.create(body));
}
