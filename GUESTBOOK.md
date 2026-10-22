# 방명록 (Spring Boot + Next.js + SQLite)

로그인 없이 이름과 한 줄 메시지를 남기는 방명록입니다. 요구사항은 [docs/PRD.md](docs/PRD.md), 구현 계획은 [docs/superpowers/plans/2026-10-22-guestbook.md](docs/superpowers/plans/2026-10-22-guestbook.md)에 있습니다.

> 이 폴더에는 별도의 Python 예제(`app.py`, `README.md`, `starter/` 등)가 함께 있습니다. 이 방명록과는 무관하며 건드리지 않았습니다.

## 실행

백엔드(8080)와 프론트엔드(3000)를 각각 실행합니다. JDK 17 이상과 Node.js가 필요합니다.

```bash
cd backend && ./gradlew bootRun      # http://localhost:8080
cd frontend && npm install && npm run dev   # http://localhost:3000
```

브라우저에서 http://localhost:3000 을 엽니다. 프론트엔드의 `/api/*` 요청은 Next.js가 백엔드로 전달합니다.

## 테스트

```bash
cd backend && ./gradlew test
cd frontend && npx vitest run
```

## 금칙어

`backend/src/main/resources/application.yml`의 `guestbook.banned-words`에 쉼표로 구분해 적습니다. 대소문자와 공백을 무시하고 검사하며, 이름과 메시지 모두에 적용됩니다. 바꾼 뒤에는 백엔드를 다시 시작하세요. 초기값(`욕설`, `badword`)은 자리표시자이니 운영 전에 교체하세요.

## 글 삭제 (관리자 기능 전까지)

글은 `backend/data/guestbook.db`(SQLite)의 `entries` 테이블에 저장됩니다. 백엔드를 끈 상태에서 SQLite 도구로 직접 지웁니다.

```sql
DELETE FROM entries WHERE id = 123;
```
