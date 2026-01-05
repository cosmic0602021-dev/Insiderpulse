# InsiderPulse 프로젝트 컨텍스트

## 토스 앱인토스 (Apps in Toss) 연동

### 문제: 토스앱에서 API 호출 시 "Access Denied" 에러

토스 미니앱에서 백엔드 서버로 fetch 요청 시 에러 발생 원인:

1. **CORS Origin 문제**: 토스앱은 특정 도메인에서 실행됨
   - 테스트 환경: `https://insiderpulse.private-apps.tossmini.com`
   - 실제 서비스: `https://insiderpulse.apps.tossmini.com`

2. **상대 경로 문제**: 클라이언트에서 `/api/...` 사용 시
   - 브라우저: `https://insiderpulse.pro/api/...` (정상)
   - 토스앱: `https://insiderpulse.private-apps.tossmini.com/api/...` (잘못된 서버!)

### 해결 방법

#### 1. 서버 CORS 설정 (`server/index.ts`)
```typescript
const ALLOWED_ORIGINS = [
  'https://insiderpulse.apps.tossmini.com',       // 토스 앱인토스 실제 서비스
  'https://insiderpulse.private-apps.tossmini.com', // 토스 앱인토스 테스트
  'https://insiderpulse.pro',                      // 프로덕션
  'http://localhost:5000',                         // 로컬 개발
];
```

#### 2. 클라이언트 URL 변환 (`client/src/lib/queryClient.ts`)
```typescript
export function resolveApiUrl(url: string): string {
  if (url.startsWith('/api') && ENV_CONFIG.isAppintos) {
    return `https://insiderpulse.pro${url}`;
  }
  return url;
}
```

#### 3. 앱인토스 환경 감지 (`client/src/lib/environment.ts`)
- `window.ReactNativeWebView` 존재 여부
- hostname이 `tossmini.com` 포함 여부
- URL에 `signature` 파라미터 존재 여부

### 참고 문서
- 토스 앱인토스 통신 가이드: https://developers-apps-in-toss.toss.im/development/test/toss.html

### .ait 파일 빌드
```bash
npx granite build
```
결과물: `/home/runner/workspace/insiderpulse.ait`

### .ait 파일 배포 (앱인토스 업로드)
```bash
npx ait deploy --api-key rhz8SlVm1muKVeprT3r7D-VAnb6WgJzl5CbCBr4U3-c --location insiderpulse.ait
```

---

## 프로젝트 구조

- `server/`: Express 백엔드
- `client/`: React 프론트엔드 (Vite)
- `shared/`: 공유 타입/스키마
- `granite.config.ts`: 앱인토스 설정 (appName: 'insiderpulse')

## 데이터베이스

- Neon PostgreSQL (프로덕션)
- DATABASE_URL이 `server/index.ts`에 하드코딩됨 (Replit 자동 주입 방지용)

## 배포

- Replit Autoscale 사용
- 도메인: https://insiderpulse.pro
