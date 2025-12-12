# MyRoutine 실행 가이드

## 사전 준비
- Node.js 18 이상 (Next.js 16 요구 사항)
- npm (패키지 관리자는 `package-lock.json`에 맞춰 npm 사용 권장)

## 설치
```bash
npm install
```

## 환경 변수
프로젝트 루트에 `.env.local`을 만들고 필요한 값을 설정합니다. 기본 API 주소는 설정하지 않으면 `http://localhost:8000`으로 동작합니다.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_TOSS_CLIENT_KEY=your_toss_client_key
```

## 개발 서버 실행
```bash
npm run dev
```
- 기본 포트는 `http://localhost:5500`입니다. (스크립트에서 지정)

## 프로덕션 빌드 및 실행
```bash
npm run build
npm start
```
- `npm start`는 빌드 결과를 기반으로 프로덕션 서버를 실행합니다.

## 기타
- 코드 스타일 검사: `npm run lint`
