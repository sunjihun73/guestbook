# 배포 가이드 (Vercel + Supabase)

계정 생성, 프로젝트 생성, 키 입력은 직접 하셔야 하는 단계입니다. 순서대로 따라 하세요.

## 1. Supabase 준비

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 만듭니다. 데이터베이스 비밀번호는 안전한 곳에 보관하세요.
2. 왼쪽 메뉴 **SQL Editor**를 열고 `supabase/migrations/20261022000000_create_entries.sql` 내용을 붙여넣어 실행합니다. `entries` 테이블이 만들어지고 RLS가 켜집니다.
   - RLS를 켜고 정책을 만들지 않은 것은 의도한 설정입니다. 브라우저는 테이블에 직접 접근할 수 없고, 서버만 접근합니다.
3. **Project Settings > API**에서 두 값을 확인합니다.
   - `Project URL` → `SUPABASE_URL`
   - `service_role` 키(또는 새 방식의 secret 키) → `SUPABASE_SERVICE_ROLE_KEY`
   - 이 키는 RLS를 우회하므로 코드나 저장소에 넣지 말고 환경변수로만 사용하세요. `anon`/publishable 키는 쓰지 않습니다.

## 2. 로컬에서 먼저 확인

```bash
cd frontend
cp .env.example .env.local     # 값을 채웁니다 (.env.local은 git에 올라가지 않습니다)
npm install
npm run dev                    # http://localhost:3000
```

글 등록, 금칙어 차단, 검색, 페이지 이동이 동작하는지 확인합니다. Supabase 대시보드 **Table Editor > entries**에 글이 보여야 합니다.

## 3. Vercel 배포

1. [vercel.com](https://vercel.com)에서 **Add New > Project**로 이 GitHub 저장소(`sunjihun73/guestbook`)를 가져옵니다.
2. **Root Directory를 `frontend`로 지정합니다.** (저장소 루트에는 별도의 Python 예제와 옛 Spring Boot `backend/`가 있어 루트로 두면 빌드가 맞지 않습니다.)
3. Framework Preset은 Next.js로 자동 감지됩니다.
4. **Environment Variables**에 세 개를 입력합니다: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BANNED_WORDS`.
5. **Deploy**를 누릅니다.

## 4. 배포 후 확인

배포 주소(`https://…vercel.app`)에서 다음을 확인하세요.

- [ ] 글을 남기면 목록 맨 위에 나타난다
- [ ] 금칙어가 들어간 글은 "사용할 수 없는 단어가 포함되어 있습니다." 문구와 함께 거절된다
- [ ] 글이 21개 이상이면 페이지가 나뉘고, 이름 일부로 검색된다
- [ ] 화면에 오류 문구가 뜨면 Vercel의 **Logs**와 환경변수 값을 확인한다 (키·URL 오타가 가장 흔합니다)

## 운영 메모

- **금칙어 변경**: Vercel 환경변수 `BANNED_WORDS`를 수정하고 **재배포**해야 반영됩니다.
- **글 삭제**: Supabase **Table Editor > entries**에서 행을 삭제합니다. (관리자 화면은 아직 없습니다.)
- **무료 플랜**: Supabase 무료 프로젝트는 일정 기간 사용이 없으면 일시 중지될 수 있습니다. 중지되면 대시보드에서 복구하세요.
- 옛 Spring Boot + SQLite 버전은 `backend/`에 로컬 참고용으로 남아 있고 배포에는 쓰이지 않습니다.
