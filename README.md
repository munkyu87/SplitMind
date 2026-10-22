# SplitMind

익명 밸런스 게임. 모바일 앱과 API를 한 저장소에서 둔다. 기획은 [docs/기획.md](docs/기획.md). 진행 체크는 [docs/PROGRESS.md](docs/PROGRESS.md).

예전 `SplitMind` 폴더의 React Native 셸을 `apps/mobile`로 옮겼다. 질문 목록부터 승인, 별점, 댓글, 신고, AI 제안까지의 서버 계약은 `apps/api`에 있다.

## 실행

```bash
cp apps/api/.env.example apps/api/.env
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev:api
```

앱은 `npm run ios` 또는 `npm run android`.

개발 중에는 `ALLOW_DEV_LOGIN=true`일 때 `POST /v1/auth/dev`로 소셜 SDK 없이 세션을 만들 수 있다. 19금 화면과 본인인증은 이번 버전에 넣지 않는다. 선택지 사진은 `POST /v1/media`로 올리고, 외부 http 주소도 그대로 쓸 수 있다.
