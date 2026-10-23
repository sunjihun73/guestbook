# 크롬 확장 프로그램 (`extension/`)

툴바 아이콘을 누르면 팝업으로 방명록이 열립니다. 화면은 `frontend/`의 컴포넌트를 가져와 팝업 크기에 맞게 줄였고,
데이터는 Vercel에 배포된 `/api/entries` API를 그대로 씁니다(별도 서버 없음).

## 빌드

```bash
cd extension
npm install
cp .env.example .env.local     # VITE_API_BASE에 Vercel 운영 주소를 넣는다 (예: https://내프로젝트.vercel.app)
npm run build                  # dist/ 생성
npm test                       # 30개 테스트
```

`VITE_API_BASE`가 없으면 빌드가 실패합니다. 이 주소는 `dist/manifest.json`의 `host_permissions`에도 들어가며,
확장 프로그램은 이 권한 덕분에 CORS 설정 없이 API를 호출합니다.

## 크롬에 설치(개발자 모드)

1. 주소창에 `chrome://extensions` 를 열고 오른쪽 위 **개발자 모드**를 켠다.
2. **압축해제된 확장 프로그램을 로드합니다**를 눌러 `extension/dist` 폴더를 고른다.
3. 툴바의 퍼즐 아이콘에서 **방명록**을 고정해 두고 클릭한다.

코드를 고친 뒤에는 `npm run build`를 다시 실행하고 `chrome://extensions`에서 새로고침(↻)을 누릅니다.

## 로컬 API로 테스트

`npm run dev`는 `.env.development`의 `http://localhost:3000`을 쓰므로, `frontend/`에서 `npm run dev`를 켜 둔 상태에서 쓰세요.

## 주의

- Vercel의 **Deployment Protection(Vercel Authentication)**이 켜져 있으면 API가 로그인 페이지를 돌려주어 "서버에 연결할 수 없습니다"가 뜹니다. 운영 도메인은 보호를 꺼야 합니다.
- Chrome 웹 스토어에 올리려면 개발자 계정 등록(1회 수수료)과 개인정보 처리 안내가 필요합니다. 그 단계는 아직 하지 않았습니다.
