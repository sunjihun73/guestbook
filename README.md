# 방명록 예제

1일차 4교시 [실습 1-2: 풀스택 프로토타이핑](../../docs/day1-guestbook.md)에서 쓰는 방명록의 완성 참고본과 확인 도구예요. 이름과 내용을 등록하고, 목록을 보고, 서버를 다시 켜도 기록이 남아요. Python 표준 라이브러리, SQLite, HTML·CSS·JavaScript만 써서 따로 설치할 패키지가 없어요.

이 폴더는 네 가지로 써요.

1. **시작 폴더**: 4교시는 모두 `starter/`를 복사해서 시작해요. 안에 인터뷰 모드 스킬(`.claude/skills/prd-interview/SKILL.md`)이 들어 있어요.
2. **완성 참고본**: 4교시에 각자 만들 방명록과 같은 API 약속을 지키는 완성본이에요. 강사가 "다 만들면 이렇게 동작해요"를 보여 줄 때 켜요.
3. **대체 경로**: Node.js나 JDK가 없거나 내려받기가 막힌 PC에서는 같은 시작 폴더에서 Python으로 만들어요.
4. **확인 도구**: `smoke_test.py`는 어떤 스택으로 만든 방명록이든 같은 API 약속을 지키는지 실제 요청으로 검사해요.

번외 시간의 [웹앱을 앱으로 만들기](../../docs/day1-app.md)에서는 `labs/app/serve.py`가 이 폴더의 `app.py`를 불러와서 PWA 파일과 함께 내보내요.

2일차 1교시 [프로젝트 지침, 스킬, TDD와 훅](../../docs/day2-rules.md)에서는 이 폴더를 `~/dbinc-d2s1` 아래로 두 번 복사해서, 지침(`labs/rules/CLAUDE.md`)이 있을 때와 없을 때를 같은 요청으로 비교해요. 이렇게 복사하면 `starter/.claude/skills/prd-interview/SKILL.md`(4교시 인터뷰 스킬)도 함께 복사돼요.

## 들어 있는 파일

| 파일 | 역할 |
| --- | --- |
| `starter/` | 4교시 시작 폴더. 인터뷰 모드 스킬(`.claude/skills/prd-interview/SKILL.md`), Python 길의 시작 화면(`index.html`), `.gitignore`, `README.md` |
| `app.py` | 완성본 서버. API와 SQLite 저장을 맡아요 |
| `static/` | 완성본 화면(`index.html`, `app.js`, `style.css`) |
| `smoke_test.py` | 실제 HTTP 요청을 보내 API 약속을 검사하는 확인 도구 |
| `REQUIREMENTS-PROMPTS.md` | 4교시 단계별 요청 모음(인터뷰, 설계, 화면 연결, Python 길, 수업 뒤 과제) |
| `examples/` | 학생용 예시와 견본. 실습마다 보내는 예시 문장(`prompts.md`), 리허설에서 실제로 만든 PRD, 확인 도구 출력, PRD와 비교한 답, 다 만든 화면 캡처 |
| `_reference/claude-runs/` | 강사용 리허설 기록. 강사가 실습 네 개를 학생 자리에서 Claude Code로 해 본 문장과 답 원문, Claude가 만든 주요 파일, 막힌 곳 |
| `Dockerfile`, `compose.yaml`, `.dockerignore` | 이 완성본을 Docker로 실행할 때 쓰는 파일 |

## 시작 폴더 쓰기

4교시에는 모두 `starter/` 폴더를 수업 저장소 밖으로 복사해서 시작해요. 탐색기나 Finder에서 이 폴더를 홈 폴더 아래 `dbinc-work`에 붙여 넣고, 이름을 내 주제로 바꿔요(예: `~/dbinc-work/praise-relay`). 그다음 Claude 데스크톱 앱의 Code 탭에서 그 폴더를 열고 Plan 모드로 바꾼 뒤 `/prd-interview 내 주제`를 보내요. 순서는 [4교시 문서](../../docs/day1-guestbook.md) 2절에 있어요.

완성본(`app.py`, `static/`) 옆에서 작업하면 Claude가 완성본을 읽고 베낄 수 있어요. 그래서 시작 폴더는 꼭 저장소 밖으로 복사해요. `.claude`처럼 점으로 시작하는 폴더는 숨겨져 보일 수 있지만 폴더째 복사하면 함께 복사돼요.

## 완성본 실행하기

이 README가 있는 폴더에서 실행해요.

```bash
python3 app.py
```

Windows는 `python3` 대신 `py`를 써요. python.org 설치본에는 `python3` 명령이 없어요.

실행 결과

```text
방명록: http://127.0.0.1:8000 / DB: /Users/.../labs/guestbook/data/guestbook.sqlite3
```

브라우저에서 http://127.0.0.1:8000 을 열어요. HTML 파일을 더블클릭해서 열면 API를 부를 수 없으니 꼭 서버 주소로 열어요. 서버는 켠 터미널에서 `Ctrl+C`로 꺼요.

기록은 `data/guestbook.sqlite3`에 저장되고, 서버를 다시 켜도 남아요. 8000 포트를 이미 쓰고 있으면 `python3 app.py --port 8001`로 켜고 주소의 포트도 바꿔요. 다른 DB 파일을 쓰려면 `--db 경로`를 붙여요.

## API 약속

4교시의 PRD에 적는 약속이에요. React와 Spring, Python, 다른 백엔드 어느 것으로 만들어도 이 약속은 같아요.

| 요청 | 성공 응답 | 내용 |
| --- | --- | --- |
| `GET /api/entries` | 200, `{"entries": [...]}` | 최신 기록부터 최대 200개 |
| `POST /api/entries` | 201, `{"entry": {...}}` | JSON 본문의 `name`, `message`를 저장 |

기록 하나에는 `id`, `name`, `message`, `created_at`이 있어요. `created_at`은 UTC(세계 표준시) 시각이에요. 이름은 앞뒤 공백을 지운 뒤 1~40자, 내용은 1~500자여야 하고, 서버가 직접 검사해요.

화면에 보이는 칸 이름은 주제에 맞게 바꿔도 돼요. JSON 키 `name`과 `message`는 그대로 둬요. 주제에 맞는 칸을 더할 때는 선택 칸으로만 더해요. 그 칸이 비어 있거나 없어도 201로 저장돼야 확인 도구가 통과해요.

실패하면 `{"error": "설명"}` 모양으로 답해요. 값이 잘못됐거나 JSON이 깨졌으면 400, 본문이 8KiB(8,192바이트)를 넘으면 413, JSON이 아닌 형식이면 415, 없는 주소면 404예요. 이 완성본은 `/app.py`나 `/data/guestbook.sqlite3` 같은 파일도 404로 막아요.

서버를 켠 터미널은 그대로 두고, 새 터미널에서 API를 직접 불러 봐요.

```bash
curl -i http://127.0.0.1:8000/api/entries -H 'Content-Type: application/json' -d '{"name":"실습자","message":"첫 기록입니다"}'
curl -i http://127.0.0.1:8000/api/entries -H 'Content-Type: application/json' -d '{"name":"   ","message":"공백 이름"}'
curl http://127.0.0.1:8000/api/entries
```

첫 요청은 `HTTP/1.0 201 Created`와 저장된 기록을, 두 번째 요청은 `HTTP/1.0 400 Bad Request`와 `{"error": "이름을 입력해 주세요."}`를 돌려줘요. 세 번째 요청이 돌려주는 목록의 맨 앞에는 방금 저장한 기록이 있어요.

## 확인 도구 smoke_test.py

쓰는 방법이 세 가지예요.

| 명령 | 검사 대상 | 언제 |
| --- | --- | --- |
| `python3 smoke_test.py` | 옆의 완성본 `app.py` | 완성본이 멀쩡한지 볼 때 |
| `python3 smoke_test.py --app 내파일.py` | 내 Python 서버 | Python 경로로 만들 때 |
| `python3 smoke_test.py --url 주소` | 이미 켜 둔 서버 | Spring(`http://127.0.0.1:8080`)처럼 켜 둔 서버를 검사할 때 |

`--app`은 빈 포트와 임시 DB로 서버를 따로 띄워서 실제 요청을 보내요. 등록, 조회, 오류 응답, 서버 재시작 뒤 기록 유지, 막아야 할 파일 경로를 검사해요. 켜 둔 서버와 그 DB는 건드리지 않아요. 내 `app.py`도 `--port`와 `--db` 옵션을 받아야 검사 도구가 서버를 띄울 수 있어요.

`--url`은 내가 켜 둔 서버에 그대로 요청을 보내요. 등록, 조회 순서, 오류 응답(400, 413, 415), 없는 경로(404)를 검사해요. 서버를 끄고 켜지는 않으니 재시작 뒤 기록이 남는지는 직접 확인해요. 검사하면서 이름이 '검사'로 시작하는 기록 3개가 내 DB에 남아요.

Spring 서버를 켜 둔 내 작업 폴더에서 실행한 예예요.

```bash
python3 ~/dbinc-ai-course/labs/guestbook/smoke_test.py --url http://127.0.0.1:8080
```

실행 결과(걸린 시간은 사람마다 달라요)

```text
검사 대상: http://127.0.0.1:8080 (켜 둔 서버. 재시작 뒤 기록 유지는 직접 확인하고, 검사용 기록 3개가 남습니다)
test_http_contract (__main__.RunningServerContractTest.test_http_contract) ... ok
test_unknown_paths (__main__.RunningServerContractTest.test_unknown_paths) ... ok
test_validation_rejects_without_inserting (__main__.RunningServerContractTest.test_validation_rejects_without_inserting) ... ok

----------------------------------------------------------------------
Ran 3 tests in 0.090s

OK
```

이 결과 모양은 Next.js 16.4와 Spring Boot 4.1(JDK 21, 당시 포트 8081)로 PRD대로 만든 방명록, 그리고 이 폴더의 `app.py`에서 똑같이 나왔어요.

> **주의** React + Spring 경로는 화면 주소(5173)가 아니라 API 주소 `http://127.0.0.1:8080`으로 검사해요. Vite 개발 서버는 없는 경로에도 화면(200)을 돌려줘서 404 검사가 실패해요.

> **주의** `--app`도 `--url`도 없으면 `(--app이 없어서 smoke_test.py 옆의 app.py를 검사합니다)`가 붙고, 내 코드가 아니라 완성본을 검사해서 늘 통과해요. 첫 줄의 `검사 대상`부터 봐요.

## Python 경로로 만들기 (대체 경로)

Node.js나 JDK를 쓸 수 없거나 npm, Gradle 내려받기가 막힌 PC에서는 같은 시작 폴더에서 Python으로 만들어요. 인터뷰로 만든 `PRD.md`는 그대로 쓰고, 설계 요청만 [REQUIREMENTS-PROMPTS.md](REQUIREMENTS-PROMPTS.md)의 'Python 길'로 바꿔요. 화면은 시작 폴더의 `index.html`을 `static/index.html`로 옮겨서 써요.

확인은 `python3 ~/dbinc-ai-course/labs/guestbook/smoke_test.py --app app.py`로 해요. 화면을 아직 만들지 않은 1단계에서는 화면 경로를 보는 `test_static_routes_and_unknown_paths` 하나만 ERROR로 나오고 마지막 줄이 `FAILED (errors=1)`이에요. 이때는 정상이에요.

## Docker로 실행하기

이 완성본을 Docker로 띄우는 파일이에요. 내 방명록(Spring, 한 덩어리 길 Next.js)의 DB를 Docker로 띄우는 방법은 [4교시 문서](../../docs/day1-guestbook.md)의 수업 뒤 과제 A에 있어요.

Docker가 설치된 PC에서 이 폴더로 이동해서 실행해요. 앞에서 켠 `python3 app.py` 서버는 먼저 꺼요. 둘 다 8000 포트를 써요.

```bash
docker compose up --build
```

컨테이너 안의 앱은 `0.0.0.0:8000`에서 받고, 내 PC에서는 `127.0.0.1:8000`으로만 들어갈 수 있어요. 기록은 `guestbook-data`라는 named volume(Docker가 따로 보관하는 저장 공간)의 `/data/guestbook.sqlite3`에 남아요. 브라우저에서 기록을 하나 남긴 뒤, 새 터미널에서 이 폴더로 이동해 컨테이너를 다시 켜고 로그를 봐요.

```bash
docker compose restart
docker compose logs --tail 20
```

새로고침했을 때 기록이 그대로 있으면 volume이 제대로 붙은 거예요. 끝낼 때는 `docker compose down`으로 컨테이너를 정리해요. volume은 남아요.

> **주의** `docker compose down -v`는 volume까지 지워서 기록이 모두 사라져요. 재시작 뒤 기록이 남는지 볼 때는 `-v`를 붙이지 않아요.

> **강사 메모** 이 문서에는 Docker 명령의 실행 결과를 싣지 않았어요. 수업 전에 교육장 PC에서 `docker compose up --build`부터 `restart`, `logs --tail 20`, `down`까지 한 번 끝까지 돌려 보고, 빌드 시간과 로그 모양을 확인해 두세요. 첫 빌드는 `python:3.13-slim` 이미지를 내려받느라 오래 걸리니 미리 받아 두면 좋아요.
