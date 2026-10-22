# 방명록 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 없이 이름과 한 줄 메시지를 남기고, 최신순 20개씩 페이지로 읽고, 이름으로 검색하는 방명록을 만든다.

**Architecture:** `backend/`의 Spring Boot REST API가 SQLite에 글을 저장하고 금칙어를 서버에서 검증한다. `frontend/`의 Next.js(App Router) 앱이 `/api/*`를 Next.js rewrites로 백엔드(8080)에 프록시해 CORS 설정이 필요 없다. UI는 shadcn/ui + Tailwind로 만든다.

**Tech Stack:** Java 17, Spring Boot 3.x(Gradle), Spring Data JPA, SQLite(`org.xerial:sqlite-jdbc` + `org.hibernate.orm:hibernate-community-dialects`), Next.js(App Router, TypeScript), Tailwind CSS, shadcn/ui, Vitest + Testing Library.

**Spec:** `docs/PRD.md`

## Global Constraints

- 로그인·관리자 화면·도배 방지·글 수정·방문자 삭제는 만들지 않는다.
- 이름: 필수, 최대 20자. 메시지: 필수, 한 줄(줄바꿈 불가), 최대 300자.
- 목록: 작성 시각 내림차순(동률이면 id 내림차순), 페이지당 정확히 20개. 페이지 크기는 클라이언트가 바꿀 수 없다.
- 검색: 이름 부분 일치, 결과도 최신순 20개씩.
- 금칙어는 서버가 등록 시점에 검사하고, 걸리면 저장하지 않는다. 목록은 설정 파일(`guestbook.banned-words`)에서 읽는다.
- 테마 컬러: 연한 파랑 + 그레이, shadcn/ui 사이트 같은 미니멀한 분위기.
- 사용자 문구는 한국어.
- 저장소는 SQLite 파일 하나(`backend/data/guestbook.db`).

## Review Focus

PRD가 암시하지만 아래 작업의 테스트가 기본으로 다루지 않는 입력들이다. 각 줄은 해당 작업의 테스트로 고정한다.

1. 이름·메시지가 공백뿐인 입력 → 400, 저장 안 됨 (Task 3)
2. 메시지에 줄바꿈이 있는 입력 → 400 (Task 3)
3. 검색어에 `%`나 `_`가 들어간 경우 → 와일드카드가 아니라 글자 그대로 검색 (Task 1)
4. 금칙어 사이에 공백을 넣거나 대소문자를 섞어 우회하는 입력 → 차단 (Task 2)
5. 범위를 벗어난 `page`(음수, 마지막 페이지 이후) → 음수는 400, 이후 페이지는 빈 목록 (Task 3)
6. `<script>` 같은 HTML이 든 메시지 → 화면에 글자 그대로 표시, 실행되지 않음 (Task 5)

---

### Task 1: 백엔드 스캐폴드와 글 저장소

**Files:**
- Create: `backend/` (Spring Initializr 구성: Gradle, Java 17, Web, Validation, Data JPA)
- Create: `backend/src/main/java/com/example/guestbook/entry/Entry.java`
- Create: `backend/src/main/java/com/example/guestbook/entry/EntryRepository.java`
- Modify: `backend/build.gradle`, `backend/src/main/resources/application.yml`
- Create: `.gitignore` (루트: `backend/build/`, `backend/data/`, `frontend/node_modules/`, `frontend/.next/`)
- Test: `backend/src/test/java/com/example/guestbook/entry/EntryRepositoryTest.java`

**Interfaces:**
- Produces:
  - `Entry`: JPA 엔티티, 필드 `Long id`, `String name`, `String message`, `Instant createdAt`. 생성자 `Entry(String name, String message)`가 `createdAt = Instant.now()`로 채운다. getter 제공.
  - `EntryRepository extends JpaRepository<Entry, Long>`: `Page<Entry> findByNameContaining(String name, Pageable pageable)`

- [ ] **Step 1: 프로젝트 생성** — 루트에서 `git init`, `backend/`에 Spring Boot 프로젝트를 만든다(패키지 `com.example.guestbook`). `build.gradle`에 `sqlite-jdbc`와 `hibernate-community-dialects`를 추가하고, `application.yml`에 `spring.datasource.url: jdbc:sqlite:data/guestbook.db`, `driver-class-name: org.sqlite.JDBC`, `spring.jpa.database-platform: org.hibernate.community.dialect.SQLiteDialect`, `spring.jpa.hibernate.ddl-auto: update`를 설정한다. 테스트는 `jdbc:sqlite::memory:`가 아니라 임시 파일 DB를 쓴다(`@DataJpaTest` + `@AutoConfigureTestDatabase(replace = NONE)` + `@TestPropertySource`로 `jdbc:sqlite:build/test.db`).
- [ ] **Step 2: 실패하는 테스트 작성** — `EntryRepositoryTest`:
  - `findByNameContaining_returnsNewestFirst`: 이름이 "민수"인 글 25개를 저장하고 `PageRequest.of(0, 20, Sort.by(DESC, "createdAt", "id"))`로 조회하면 `content.size() == 20`, `totalElements == 25`, 첫 원소가 가장 나중에 저장한 글.
  - `findByNameContaining_matchesPartialName`: "김민수", "이영희" 저장 후 "민수" 검색 → 1건("김민수").
  - `findByNameContaining_treatsPercentAndUnderscoreLiterally`: "100%", "abc" 저장 후 "%" 검색 → 1건("100%"), "_" 검색 → 0건. (Review Focus 3)
- [ ] **Step 3: 실패 확인** — Run: `cd backend && ./gradlew test --tests '*EntryRepositoryTest'` — Expected: 컴파일 실패(Entry 없음).
- [ ] **Step 4: 구현** — `Entry`(테이블 `entries`, `name` length 20 not null, `message` length 300 not null)와 `EntryRepository`를 작성한다. 와일드카드가 이스케이프되지 않아 Step 2의 세 번째 테스트가 실패하면 `@Query`에 `LIKE %:name% ESCAPE '\'`를 쓰고 `%`, `_`, `\`를 이스케이프하는 방식으로 바꾼다.
- [ ] **Step 5: 통과 확인** — Run: `./gradlew test --tests '*EntryRepositoryTest'` — Expected: 3 tests PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: backend scaffold and entry repository"`

### Task 2: 금칙어 필터

**Files:**
- Create: `backend/src/main/java/com/example/guestbook/banned/BannedWordFilter.java`
- Modify: `backend/src/main/resources/application.yml` (`guestbook.banned-words` 초기 목록 추가)
- Test: `backend/src/test/java/com/example/guestbook/banned/BannedWordFilterTest.java`

**Interfaces:**
- Produces: `@Component BannedWordFilter` — 생성자 `BannedWordFilter(@Value("${guestbook.banned-words}") List<String> words)`, 메서드 `boolean containsBannedWord(String text)`.

- [ ] **Step 1: 실패하는 테스트 작성** — 금칙어 `["badword", "욕설"]`로 만든 필터에서:
  - `"this has badword inside"` → true, `"좋은 하루"` → false
  - `"BadWord"` → true (대소문자 무시)
  - `"b a d w o r d"`, `"욕 설"` → true (공백 삽입 우회, Review Focus 4)
  - `null`과 `""` → false
- [ ] **Step 2: 실패 확인** — Run: `./gradlew test --tests '*BannedWordFilterTest'` — Expected: 컴파일 실패.
- [ ] **Step 3: 구현** — 검사 대상 텍스트와 금칙어를 모두 소문자로 바꾸고 공백을 제거한 뒤 `contains`로 비교한다. 빈 금칙어는 무시한다. `application.yml`의 초기 목록은 플레이스홀더 2~3개(예: `욕설`, `badword`)로 두고 운영자가 교체한다.
- [ ] **Step 4: 통과 확인** — Run: `./gradlew test --tests '*BannedWordFilterTest'` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat: banned word filter"`

### Task 3: 글 서비스와 REST API

**Files:**
- Create: `backend/src/main/java/com/example/guestbook/entry/EntryService.java`
- Create: `backend/src/main/java/com/example/guestbook/entry/EntryController.java`
- Create: `backend/src/main/java/com/example/guestbook/entry/dto/CreateEntryRequest.java`, `EntryResponse.java`, `EntryPageResponse.java`
- Create: `backend/src/main/java/com/example/guestbook/entry/BannedWordException.java`, `ApiExceptionHandler.java`
- Test: `backend/src/test/java/com/example/guestbook/entry/EntryControllerTest.java`

**Interfaces:**
- Consumes: `EntryRepository.findByNameContaining`, `BannedWordFilter.containsBannedWord`.
- Produces (프론트엔드가 의존하는 계약):
  - `POST /api/entries` — 요청 `{ "name": string, "message": string }`. 성공 201 + `EntryResponse`. 실패 400 + `{ "code": "BANNED_WORD" | "VALIDATION", "message": string }`.
  - `GET /api/entries?name=<선택>&page=<0부터, 기본 0>` — 200 + `EntryPageResponse`. `page < 0`이면 400 `VALIDATION`.
  - `EntryResponse`: `{ id: number, name: string, message: string, createdAt: string(ISO-8601) }`
  - `EntryPageResponse`: `{ entries: EntryResponse[], page: number, totalPages: number, totalElements: number }`
  - `EntryService`: `EntryResponse create(String name, String message)`(금칙어면 `BannedWordException`), `EntryPageResponse list(String nameOrNull, int page)`(크기 고정 20, `createdAt`·`id` 내림차순).

- [ ] **Step 1: 실패하는 테스트 작성** — `@SpringBootTest` + `MockMvc`, 금칙어 `["욕설"]`:
  - `post_validEntry_returns201AndAppearsFirstInList`
  - `post_bannedWordInMessage_returns400BannedWordAndStoresNothing` — `code == "BANNED_WORD"`, 이후 목록이 비어 있다.
  - `post_bannedWordInName_returns400BannedWord`
  - `post_blankName_returns400Validation`, `post_whitespaceOnlyMessage_returns400Validation` (Review Focus 1)
  - `post_messageWithNewline_returns400Validation` (Review Focus 2)
  - `post_name21Chars_returns400`, `post_name20Chars_returns201`
  - `post_message301Chars_returns400`, `post_message300Chars_returns201`
  - `post_trimsSurroundingWhitespace` — `"  민수  "`는 `"민수"`로 저장된다.
  - `get_returns20PerPage` — 25개 저장 후 page 0은 20개, page 1은 5개, `totalPages == 2`.
  - `get_pageBeyondLast_returnsEmptyList`, `get_negativePage_returns400` (Review Focus 5)
  - `get_nameFilter_returnsOnlyMatchingNamesPaged`
- [ ] **Step 2: 실패 확인** — Run: `./gradlew test --tests '*EntryControllerTest'` — Expected: 컴파일 실패.
- [ ] **Step 3: 구현** — 검증 어노테이션(`@NotBlank`, `@Size(max=20)`, `@Size(max=300)`, 메시지는 `@Pattern(regexp="[^\\r\\n]*")`)은 `CreateEntryRequest`에 둔다. 값은 서비스에서 `trim()`한 뒤 길이·공백 검증이 어긋나지 않도록, 트림을 요청 역직렬화 단계(compact constructor)에서 한다. `ApiExceptionHandler`가 `MethodArgumentNotValidException`과 `BannedWordException`을 위 계약의 400 본문으로 바꾼다. 금칙어 안내 문구는 "사용할 수 없는 단어가 포함되어 있습니다."로 한다. 테스트 사이 격리를 위해 `@BeforeEach`에서 `repository.deleteAll()`.
- [ ] **Step 4: 통과 확인** — Run: `./gradlew test` — Expected: 전체 PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat: entry service and REST API"`

### Task 4: 프론트엔드 스캐폴드, 테마, API 클라이언트

**Files:**
- Create: `frontend/` (`create-next-app`: TypeScript, Tailwind, App Router, src 디렉터리 사용)
- Modify: `frontend/next.config.ts` (rewrites), `frontend/src/app/globals.css` (테마), `frontend/package.json` (vitest)
- Create: `frontend/src/lib/api.ts`, `frontend/vitest.config.ts`
- Test: `frontend/src/lib/api.test.ts`

**Interfaces:**
- Consumes: Task 3의 REST 계약.
- Produces (`frontend/src/lib/api.ts`):
  - `type Entry = { id: number; name: string; message: string; createdAt: string }`
  - `type EntryPage = { entries: Entry[]; page: number; totalPages: number; totalElements: number }`
  - `class ApiError extends Error { code: "BANNED_WORD" | "VALIDATION" | "NETWORK" }`
  - `fetchEntries(params: { name?: string; page: number }): Promise<EntryPage>`
  - `createEntry(input: { name: string; message: string }): Promise<Entry>` — 400 응답이면 본문의 `code`/`message`로 `ApiError`를 던진다. fetch 자체가 실패하면 `code: "NETWORK"`.

- [ ] **Step 1: 프로젝트 생성과 설정** — `create-next-app`, `npx shadcn@latest init`(기본 neutral 대신 슬레이트 계열), `button input card pagination`을 추가한다. `next.config.ts`에 `/api/:path*` → `http://localhost:8080/api/:path*` rewrite를 넣는다. `globals.css`의 shadcn 토큰에서 `--primary`를 연한 파랑(예: `oklch(0.75 0.1 240)`), 배경·테두리·muted를 그레이 계열로 바꾼다. 채도가 낮은 파랑 위에서도 버튼 글자 대비가 충분한지 눈으로 확인한다.
- [ ] **Step 2: 실패하는 테스트 작성** — `api.test.ts`(`fetch` 모킹):
  - `fetchEntries`가 `name`이 있으면 `/api/entries?name=...&page=N`을 호출하고, 없으면 `name` 파라미터를 보내지 않는다. 이름은 URL 인코딩된다(`"a&b"` → `a%26b`).
  - `createEntry`가 400 `{code:"BANNED_WORD", message}`를 받으면 `ApiError`(`code === "BANNED_WORD"`)를 던진다.
  - `fetch`가 reject되면 `code === "NETWORK"`.
- [ ] **Step 3: 실패 확인** — Run: `cd frontend && npx vitest run src/lib/api.test.ts` — Expected: FAIL(모듈 없음).
- [ ] **Step 4: 구현** — `api.ts`를 위 시그니처대로 작성한다.
- [ ] **Step 5: 통과 확인** — Run: `npx vitest run` — Expected: PASS. `npm run build`도 성공해야 한다.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: frontend scaffold, theme, api client"`

### Task 5: 방명록 화면

**Files:**
- Create: `frontend/src/components/EntryForm.tsx`, `EntryList.tsx`, `SearchBar.tsx`, `GuestbookPagination.tsx`
- Modify: `frontend/src/app/page.tsx`, `frontend/src/app/layout.tsx` (제목 "방명록", `lang="ko"`)
- Test: `frontend/src/components/EntryForm.test.tsx`, `EntryList.test.tsx`, `frontend/src/app/page.test.tsx`

**Interfaces:**
- Consumes: `fetchEntries`, `createEntry`, `ApiError`, `Entry`, `EntryPage` (Task 4).
- Produces:
  - `EntryForm({ onCreated }: { onCreated: () => void })` — 이름·메시지 입력, 등록 버튼, 메시지 글자 수 `n/300` 표시, 입력 `maxLength`로 20/300 제한, 실패 시 폼 안에 오류 문구 표시.
  - `EntryList({ entries }: { entries: Entry[] })` — 이름, 메시지, 작성 시각(한국어 로케일) 표시. 비어 있으면 "아직 남겨진 글이 없습니다." 또는 검색 중이면 "검색 결과가 없습니다."를 보여 준다(`isSearch` prop).
  - `SearchBar({ initialName, onSearch }: { initialName: string; onSearch: (name: string) => void })`
  - `GuestbookPagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void })` — `totalPages <= 1`이면 렌더링하지 않는다.
  - `page.tsx`는 클라이언트 컴포넌트로, 검색어와 페이지 번호를 URL 쿼리(`?name=&page=`)와 동기화한다. 등록 성공 시 검색어를 비우고 0페이지로 이동해 새 글이 맨 위에 보인다.

- [ ] **Step 1: 실패하는 테스트 작성**
  - `EntryForm.test.tsx`: 이름이나 메시지가 비면 `createEntry`를 호출하지 않는다 / 정상 입력 시 `createEntry({name, message})` 호출 후 `onCreated` 호출, 입력창 비워짐 / `ApiError("BANNED_WORD")`면 "사용할 수 없는 단어가 포함되어 있습니다." 표시, 입력은 유지 / 메시지 입력 시 글자 수 표시가 `3/300`처럼 갱신.
  - `EntryList.test.tsx`: 메시지 `<script>alert(1)</script>`가 텍스트로 보이고 DOM에 `script` 요소가 생기지 않는다(Review Focus 6) / 빈 목록 문구 두 가지.
  - `page.test.tsx`(api 모듈 모킹): 첫 렌더에서 `fetchEntries({page:0})` 호출 / 검색 제출 시 `fetchEntries({name:"민수", page:0})` / 페이지 2 클릭 시 `page:1`로 호출 / 등록 성공 후 목록 재조회.
- [ ] **Step 2: 실패 확인** — Run: `npx vitest run` — Expected: FAIL.
- [ ] **Step 3: 구현** — 컴포넌트를 위 시그니처대로 작성한다. 메시지 입력은 한 줄 `<input>`이다(줄바꿈 불가). 서버가 거절해도 클라이언트의 `maxLength`가 1차 방어선이다. 레이아웃은 가운데 정렬된 `max-w-2xl` 컬럼: 제목, 작성 카드, 검색창, 목록, 페이지네이션 순서. 목록 항목은 shadcn `Card`를 쓰고 이름은 진하게, 시각은 muted 그레이로 표시한다.
- [ ] **Step 4: 통과 확인** — Run: `npx vitest run && npm run build` — Expected: PASS, 빌드 성공.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: guestbook page"`

### Task 6: 통합 확인과 실행 안내

**Files:**
- Create: `README.md` (루트: 실행 방법, 금칙어 설정 위치, 삭제는 `sqlite3 backend/data/guestbook.db "DELETE FROM entries WHERE id = ?"`로 직접 한다는 안내)

- [ ] **Step 1: 두 서버 기동** — Run: `cd backend && ./gradlew bootRun`(8080), `cd frontend && npm run dev`(3000).
- [ ] **Step 2: 브라우저로 확인** — `http://localhost:3000`에서 다음을 직접 확인한다. 정상 글 등록 시 맨 위에 보임 / 금칙어 글은 오류 문구가 나오고 목록에 안 생김 / 글 21개 이상일 때 페이지 이동 / 이름 일부로 검색 / 새로고침해도 `?name=&page=` 상태 유지 / 연한 파랑 + 그레이 테마.
- [ ] **Step 3: 전체 테스트** — Run: `cd backend && ./gradlew test` 와 `cd frontend && npx vitest run` — Expected: 모두 PASS.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "docs: README and verification"`

---

## Self-Review 결과

- **PRD 커버리지:** 글 작성(Task 3·5), 목록 최신순 20개(Task 1·3·5), 이름 부분 일치 검색(Task 1·3·5), 금칙어(Task 2·3), 테마·스택(Task 4), 성공 기준 4개는 Task 6 수동 확인과 Task 3·5 테스트로 덮인다. 빠진 요구사항 없음.
- **타입 일관성:** `Entry`/`EntryPage`/`ApiError` 필드명이 Task 3의 응답 계약과 Task 4·5에서 동일하다.
- **PRD의 제안값:** 이름 20자, 부분 일치, 최신순, 금칙어 설정 파일, shadcn/ui + Tailwind, DB 직접 삭제를 이 계획이 그대로 따른다.
- **알려진 한계:** 글자 수는 Java `String` 길이(UTF-16) 기준이라 이모지는 2자로 센다. 한글 300자 기준에는 영향이 없다.
