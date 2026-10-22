# 방명록 Vercel + Supabase 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (사용자가 직접 구현 방식을 선택함). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Spring Boot 백엔드의 규칙을 Next.js Route Handler로 옮기고 저장소를 Supabase Postgres로 바꿔 Vercel에 배포 가능하게 만든다.

**Architecture:** `frontend/src/app/api/entries/route.ts`가 `GET`/`POST`를 처리한다. 검증·금칙어 로직은 `src/lib/server/`의 순수 함수, DB 접근은 `EntryRepository` 인터페이스 뒤에 두고 Supabase 구현을 주입한다. 응답 JSON 계약은 기존 `src/lib/api.ts`와 동일해 화면 코드는 바꾸지 않는다.

**Tech Stack:** Next.js 16 (Route Handler), TypeScript, `@supabase/supabase-js`, Vitest.

**Spec:** `docs/PRD.md` (6장 변경 이력 포함)

## Global Constraints

- 이름: 필수, 최대 20자. 메시지: 필수, 한 줄(CR/LF 불가), 최대 300자. 앞뒤 유니코드 공백은 제거 후 검증한다.
- 페이지당 정확히 20개, 정렬은 `created_at DESC, id DESC`, 이름 부분 일치 검색(대소문자 무시, `%` `_` `\`는 글자 그대로).
- 금칙어: 이름과 메시지 모두 검사, 대소문자·유니코드 공백·제로폭 문자 무시. 목록은 환경변수 `BANNED_WORDS`(쉼표 구분), 없으면 `욕설,badword`.
- 응답 계약: 성공 `201 {id,name,message,createdAt}` / 목록 `200 {entries,page,totalPages,totalElements}` / 오류 `400 {code:"BANNED_WORD"|"VALIDATION",message}`. 금칙어 문구는 "사용할 수 없는 단어가 포함되어 있습니다.".
- `page < 0` 또는 숫자가 아니면 400 `VALIDATION`, 마지막 페이지 이후는 빈 목록.
- Supabase 키는 서버 환경변수(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)로만 쓰고 `NEXT_PUBLIC_`를 붙이지 않는다. 테이블은 RLS 켜고 정책 없음.
- 기존 `backend/`는 삭제하지 않는다. 배포 대상은 `frontend/`다.

## Review Focus

1. Supabase 호출이 실패(네트워크, 키 오류)하면 → 500이 아니라 JSON 오류(`500 {code:"SERVER", message}`)이고 화면이 오류 문구를 보여 준다 (Task 3)
2. 요청 본문이 JSON이 아니거나 필드 타입이 문자열이 아님(숫자, 배열) → 400 `VALIDATION` (Task 3)
3. 검색어에 `%` `_` `\` → 와일드카드로 해석되지 않음 (Task 2)
4. 탭·전각 공백·제로폭 문자로 쪼갠 금칙어 → 차단 (Task 1)
5. `BANNED_WORDS`가 비었거나 공백뿐 → 모든 글이 막히지 않음 (Task 1)

---

### Task 1: 서버 검증과 금칙어

**Files:**
- Create: `frontend/src/lib/server/text.ts`, `banned.ts`, `validation.ts`
- Test: `frontend/src/lib/server/text.test.ts`, `banned.test.ts`, `validation.test.ts`

**Interfaces:**
- Produces:
  - `text.ts`: `stripEdges(text: string): string`, `removeAll(text: string): string` — 공백 클래스 `[\p{Z}\s​-‍﻿]`(`u` 플래그).
  - `banned.ts`: `createBannedWordFilter(words: string[]): (text: string | null | undefined) => boolean`, `parseBannedWords(raw: string | undefined): string[]`(미설정이면 `["욕설","badword"]`).
  - `validation.ts`: `type NewEntry = { name: string; message: string }`, `validateNewEntry(body: unknown): { ok: true; value: NewEntry } | { ok: false }`.

- [ ] **Step 1: 실패하는 테스트 작성** — `text.test.ts`: `stripEdges("　a ")==="a"`, `removeAll("b\ta​d")==="bad"`. `banned.test.ts`(금칙어 `["badword","욕설"]`): 포함 true/미포함 false, `"BadWord"` true, `"b a d w o r d"`·`"욕 설"`·`"bad\tword"`·`"욕　설"`·`"bad word"`·`"bad​word"` true, `null`/`undefined`/`""` false, 금칙어에 `""`·`"  "`만 있어도 `"아무 말"` false(Review Focus 5), `parseBannedWords(undefined)`는 기본 2개, `parseBannedWords(" a , b ,,")`는 `["a","b"]`. `validation.test.ts`: 정상 입력 통과·트림, 이름/메시지 공백뿐(`"   "`, `"　"`, `"  "`) 거절, 이름 20자 통과·21자 거절, 메시지 300자 통과·301자 거절, 메시지 중간 `\n`/`\r` 거절, 숫자·배열·null·`undefined` 필드와 `null`/문자열 본문 거절.
- [ ] **Step 2: 실패 확인** — Run: `cd frontend && npx vitest run src/lib/server` — Expected: FAIL(모듈 없음).
- [ ] **Step 3: 구현** — 위 시그니처대로 작성한다. 길이는 `[...str].length`가 아니라 `str.length`(UTF-16)로 센다(프론트 `maxLength`와 일치). 금칙어 비교 전에 소문자화 후 `removeAll` 한다.
- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src/lib/server` — Expected: PASS.
- [ ] **Step 5: Commit** — `git add frontend && git commit -m "feat: server-side validation and banned word filter"`

### Task 2: 저장소와 Supabase 스키마

**Files:**
- Create: `supabase/migrations/20261022000000_create_entries.sql`
- Create: `frontend/src/lib/server/entries-repo.ts`, `supabase-client.ts`
- Test: `frontend/src/lib/server/entries-repo.test.ts`
- Modify: `frontend/package.json` (`@supabase/supabase-js`)

**Interfaces:**
- Consumes: `NewEntry`(Task 1).
- Produces:
  - `type Entry = { id: number; name: string; message: string; createdAt: string }`
  - `interface EntryRepository { create(entry: NewEntry): Promise<Entry>; list(params: { name?: string; page: number; pageSize: number }): Promise<{ entries: Entry[]; totalElements: number }> }`
  - `createSupabaseEntryRepository(client: SupabaseClientLike): EntryRepository` — `SupabaseClientLike`는 사용하는 쿼리 빌더 메서드만 담은 최소 타입.
  - `escapeLike(term: string): string` — `\`, `%`, `_` 앞에 `\`를 붙인다.
  - `getEntryRepository(): EntryRepository` — `supabase-client.ts`가 환경변수로 클라이언트를 만든다(`auth: { persistSession: false }`). 환경변수가 없으면 명확한 메시지로 throw.

- [ ] **Step 1: SQL 작성** — `entries(id bigint generated always as identity primary key, name text not null check (char_length(name) between 1 and 20), message text not null check (char_length(message) between 1 and 300 and message !~ E'[\\r\\n]'), created_at timestamptz not null default now())`, 인덱스 `(created_at desc, id desc)`, `alter table entries enable row level security;`(정책 없음).
- [ ] **Step 2: 실패하는 테스트 작성** — 페이크 클라이언트(호출 기록)로: `create`가 `from("entries").insert({name,message}).select().single()`을 호출하고 `created_at`을 `createdAt`으로 변환한다 / `list`가 `select("*", {count:"exact"})`, `order("created_at",{ascending:false})`, `order("id",{ascending:false})`, `range(page*size, page*size+size-1)`를 호출한다 / `name`이 있으면 `ilike("name", "%"+escapeLike(name)+"%")`, 없으면 `ilike`를 호출하지 않는다 / `escapeLike("100%_a\\")==="100\\%\\_a\\\\"`(Review Focus 3) / Supabase가 `{error}`를 돌려주면 `list`·`create`가 throw한다.
- [ ] **Step 3: 실패 확인** — Run: `npx vitest run src/lib/server/entries-repo.test.ts` — Expected: FAIL.
- [ ] **Step 4: 구현** — `npm i @supabase/supabase-js`(peer 충돌 시 ledger에 기록하고 해결). 어댑터는 얇게 유지한다.
- [ ] **Step 5: 통과 확인** — Run: `npx vitest run` — Expected: 전체 PASS.
- [ ] **Step 6: Commit** — `git add frontend supabase && git commit -m "feat: supabase entry repository and schema"`

### Task 3: Route Handler

**Files:**
- Create: `frontend/src/app/api/entries/route.ts`, `frontend/src/lib/server/entries-service.ts`
- Modify: `frontend/next.config.ts` (`/api` rewrites 제거)
- Test: `frontend/src/lib/server/entries-service.test.ts`, `frontend/src/app/api/entries/route.test.ts`

**Interfaces:**
- Consumes: `validateNewEntry`, `createBannedWordFilter`, `parseBannedWords`, `EntryRepository`.
- Produces:
  - `createEntriesService(deps: { repo: EntryRepository; isBanned: (t: string) => boolean }): { create(body: unknown): Promise<ServiceResult<Entry>>; list(query: { name: string | null; page: string | null }): Promise<ServiceResult<EntryPageResponse>> }`
  - `type ServiceResult<T> = { status: 200 | 201; body: T } | { status: 400 | 500; body: { code: "BANNED_WORD" | "VALIDATION" | "SERVER"; message: string } }`
  - `route.ts`: `export async function GET(request: NextRequest)`, `export async function POST(request: NextRequest)`; 서비스는 `getEntryRepository()`와 `process.env.BANNED_WORDS`로 구성하고, 본문 JSON 파싱 실패는 `create(undefined)` 취급(400).

- [ ] **Step 1: 실패하는 테스트 작성** — `entries-service.test.ts`(메모리 페이크 repo): 정상 등록 201 / 금칙어(메시지, 이름) 400 `BANNED_WORD`+저장 안 됨 / 검증 실패 400 `VALIDATION`+저장 안 됨 / `list`: `page` 기본 0, `"-1"`·`"abc"` 400, `pageSize`는 20, `totalPages = ceil(total/20)`, 범위 밖 페이지는 빈 목록, 이름이 공백뿐이면 `name` 없이 조회 / repo가 throw하면 500 `SERVER`(Review Focus 1). `route.test.ts`: `getEntryRepository`를 모킹해 `POST`가 잘못된 JSON 본문(`"{"`)에 400 `VALIDATION`(Review Focus 2), 정상 본문에 201을 돌려준다. `GET /api/entries?page=1&name=a`가 서비스에 `page:"1", name:"a"`를 넘긴다.
- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/server/entries-service.test.ts src/app/api` — Expected: FAIL.
- [ ] **Step 3: 구현** — 서비스는 순수 로직, route는 `Response.json(result.body, { status })`만 한다. 메시지 문구는 기존 Spring 응답과 같게: 검증 실패 "이름은 1~20자, 메시지는 한 줄 1~300자로 입력해 주세요.", 잘못된 page "요청 값이 올바르지 않습니다.", 서버 오류 "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.". `next.config.ts`에서 `rewrites`를 삭제한다.
- [ ] **Step 4: 프론트 오류 처리 확인** — `src/lib/api.ts`가 `500 {code:"SERVER"}`를 `ApiError`로 바꾸도록 `ApiErrorCode`에 `"SERVER"`를 추가하고, `api.test.ts`에 해당 케이스(500 → `code === "SERVER"`, 서버 메시지 유지)를 먼저 추가해 실패를 확인한 뒤 구현한다.
- [ ] **Step 5: 통과 확인** — Run: `npx vitest run && npm run build && npm run lint` — Expected: 전체 PASS, 빌드·lint 성공.
- [ ] **Step 6: Commit** — `git add frontend && git commit -m "feat: entries route handler on supabase"`

### Task 4: 환경설정과 배포 문서

**Files:**
- Create: `frontend/.env.example`, `DEPLOY.md`
- Modify: `GUESTBOOK.md`, `.gitignore` (`.env*.local`은 create-next-app이 frontend/.gitignore로 이미 처리했는지 확인)

- [ ] **Step 1: `.env.example`** — `SUPABASE_URL=`, `SUPABASE_SERVICE_ROLE_KEY=`, `BANNED_WORDS=욕설,badword`(주석: 서버 전용, `NEXT_PUBLIC_` 금지).
- [ ] **Step 2: `DEPLOY.md`** — Supabase 프로젝트 생성 → SQL Editor(또는 `supabase db push`)로 마이그레이션 실행 → Project Settings > API에서 URL과 service_role(또는 secret) 키 확인 → Vercel에 GitHub 저장소 Import, **Root Directory를 `frontend`로** 지정 → Environment Variables 3개 입력 → Deploy → 배포 주소에서 글 등록·금칙어·검색 확인 순서로, 사용자가 직접 해야 하는 단계임을 명시한다. 로컬 실행(`frontend/.env.local` 작성 후 `npm run dev`)도 적는다.
- [ ] **Step 3: `GUESTBOOK.md` 갱신** — 실행 방법을 Next.js + Supabase 기준으로 바꾸고, `backend/`는 이전 로컬 버전(참고용)이라고 표시한다.
- [ ] **Step 4: 전체 검증과 Commit** — Run: `cd frontend && npx vitest run && npm run build` — Expected: PASS. `git add -A` 대신 변경 경로만 지정해 커밋한다.

---

## Self-Review 결과

- **PRD 커버리지:** 작성·목록·검색·금칙어·20개/최신순(Task 1~3), Vercel+Supabase 배포(Task 4), 보안 결정(RLS·서버 키, Task 2·4).
- **한계:** 실제 Supabase에 연결한 통합 확인은 사용자 계정이 있어야 가능하다. 어댑터는 페이크 클라이언트로만 테스트되므로 배포 후 DEPLOY.md의 확인 단계가 필요하다.
