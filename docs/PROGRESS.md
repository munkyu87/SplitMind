# 진행 상황 체크리스트

어디까지 됐는지는 이 문서를 본다. 규칙과 화면 설명은 `docs/기획.md`, 시안은 `docs/screens`이다. 끝난 항목만 체크한다. 화면은 시뮬레이터나 실기기에서 본 뒤에 체크한다.

마지막 갱신: 2026-10-22

## 구성

추첨일기와 같이 한 저장소에 프론트와 서버를 둔다. 이미 그렇게 되어 있다.

| 경로 | 역할 |
| --- | --- |
| `apps/mobile` | React Native 앱 |
| `apps/api` | NestJS API |
| `packages/contract` | 앱과 API가 같이 쓰는 zod 스키마 |
| `docker-compose.yml` | 로컬 Postgres 16. 호스트 포트 5434 |

운영도 추첨일기와 같이 AWS Lightsail 서울, 인스턴스 한 대, Docker Compose(Postgres + API + Caddy)로 한다. 인스턴스 만들기, 고정 IP, 배포 스크립트는 앱 한 바퀴가 끝난 뒤에 한다. 그 절차는 그때 `docs/DEPLOY.md`에 남긴다.

## 지금

서버의 질문·투표·댓글·제안·승인·AI 초안은 로컬에서 연결되어 있다. 앱은 로그인 골격만 있고, 확정 시안은 아직 화면에 없다. Lightsail은 시작하지 않았다.

## 1. 이미 된 것

- [x] 모노레포. `apps/mobile`, `apps/api`, `packages/contract`
- [x] 로컬 Postgres. `npm run db:up`, 마이그레이션, 시드 16개
- [x] 개발 로그인 `POST /v1/auth/dev`. 소셜 SDK 없이 세션
- [x] 질문, 투표, 결과, 별점, 댓글, 신고, 제안, 승인, AI 초안 API
- [x] 기획 규칙과 화면 흐름. 19금 화면은 이후로 미룸
- [x] 예시 화면 확정. `docs/screens`

## 2. 서버를 화면에 맞추기

화면을 붙이기 전에 서버가 규칙을 거절하게 만든다. 화면만 숨기면 다른 클라이언트는 그대로 새어 나온다.

- [ ] 투표 전에는 결과, 댓글, 별점을 `403 NOT_ANSWERED`
- [ ] 별점 순은 별점 5개 미만 제외
- [ ] `GET /v1/me/answers`에 고른 문장
- [ ] 내 제안은 `GET /v1/me/suggestions`만. `GET /v1/suggestions/mine` 정리
- [ ] AI 초안 후보에서 19금 slug 제외

## 3. 앱 화면

`docs/screens`를 앱에 옮긴다. 세션은 Auth 컨텍스트와 MMKV, 서버 상태는 TanStack Query. 로그인은 `POST /v1/auth/dev`.

- [ ] 테마를 확정 시안으로. 따뜻한 흰색, 연보라·분홍 면, 노란 주요 버튼, 카테고리 색
- [ ] 로그인
- [ ] 질문 목록. 검색, 칩, 정렬, 참여완료
- [ ] 선택과 제출 확인
- [ ] 결과, 별점, 댓글
- [ ] 제안
- [ ] 내 제안
- [ ] 마이페이지 참여 기록
- [ ] 관리자 대기, 신고, AI 설정

## 4. 로컬에서 한 바퀴

시뮬레이터에서 아래 순서대로 본 뒤에 체크한다.

```bash
cp apps/api/.env.example apps/api/.env
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev:api
npm run ios
```

- [ ] 개발 로그인 → 목록 → 고르기 → 확인 → 결과 → 별점 → 댓글
- [ ] 투표 전에 결과와 댓글이 안 열리는지
- [ ] 제안 작성 → 관리자 승인 → 목록에 보이는지
- [ ] 거절 사유가 내 제안에 보이는지
- [ ] 이미 고른 질문은 목록 뱃지에서 결과로 가는지

## 5. 나중 — 스토어 전

- [ ] 카카오, 네이버, 구글 네이티브 SDK
- [ ] 본인인증 후 19금 공개
- [ ] 선택지 이미지 업로드
- [ ] 질문 비공개
- [ ] 계정 탈퇴, 약관 동의 시각 저장

## 6. 나중 — Lightsail

추첨일기 `docs/DEPLOY.md`와 같은 모양이다. 지금은 체크하지 않는다.

- [ ] Lightsail 서울, Ubuntu, 인스턴스 한 대. Docker, 스왑, 시간대 Asia/Seoul
- [ ] Compose: Postgres + API + Caddy. 포트 22, 80, 443
- [ ] 고정 IP. 도메인 전까지 sslip.io와 Caddy 인증서
- [ ] `.env`는 서버에만. 저장소와 개발 PC에 두지 않음
- [ ] 개발 PC에서 돌리는 `deploy.sh`. 헬스 확인 후 끝
- [ ] DB 볼륨 유지. 마이그레이션만 추가 적용
- [ ] 월 예산 알림, DB 백업
- [ ] 앱 릴리스 빌드의 API 주소를 그 서버로
