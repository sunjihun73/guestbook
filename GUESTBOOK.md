# 방명록 (Next.js + Supabase)

로그인 없이 이름과 한 줄 메시지를 남기는 방명록입니다. 요구사항은 [docs/PRD.md](docs/PRD.md), 구현 계획은 [docs/superpowers/plans/](docs/superpowers/plans/)에 있습니다.

> 이 폴더에는 별도의 Python 예제(`app.py`, `README.md`, `starter/` 등)가 함께 있습니다. 이 방명록과는 무관합니다.

## 구조

- `frontend/` — Next.js 앱. 화면과 API(`/api/entries` Route Handler)가 모두 여기에 있고, 데이터는 Supabase Postgres에 저장합니다. **배포 대상입니다.**
- `supabase/migrations/` — 테이블 생성 SQL
- `backend/` — 이전 버전(Spring Boot + SQLite). 로컬 참고용이며 더 이상 프론트엔드와 연결되지 않습니다.

## 로컬 실행

Supabase 프로젝트가 필요합니다. 준비 방법은 [DEPLOY.md](DEPLOY.md)의 1~2단계를 따르세요.

```bash
cd frontend
cp .env.example .env.local   # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 입력
npm install
npm run dev                  # http://localhost:3000
```

## 테스트

```bash
cd frontend && npx vitest run
```

## 배포

[DEPLOY.md](DEPLOY.md)를 참고하세요 (Vercel + Supabase).

## 금칙어

환경변수 `BANNED_WORDS`에 쉼표로 구분해 적습니다(로컬은 `.env.local`, Vercel은 Environment Variables). 대소문자·모든 종류의 공백·제로폭 문자를 무시하고, 이름과 메시지 모두에 적용됩니다. 기본값 `욕설,badword`는 자리표시자이니 운영 전에 바꾸세요.

## 글 삭제 (관리자 기능 전까지)

Supabase 대시보드 **Table Editor > entries**에서 행을 삭제합니다.
