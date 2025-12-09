# InsiderPulse.pro 프로젝트 컨텍스트

## 프로젝트 개요
- **이름**: InsiderPulse.pro
- **목적**: 내부자 거래 추적 및 실시간 알림 플랫폼
- **스택**: React + TypeScript + Express + PostgreSQL + Stripe

## 최근 해결한 주요 버그 (2025-11-16)

### 문제: Pro 구독 사용자가 무료 사용자로 취급됨
- **증상**: "무료 체험 종료", "48시간 지연 데이터" 메시지 표시, 모든 거래 잠김
- **근본 원인**: Stripe의 "canceled" 상태를 "즉시 접근 차단"으로 잘못 해석
  - Stripe에서 "canceled"는 "갱신 안 함"을 의미 (current_period_end까지 접근 유지)
  - 시스템은 "canceled" = "접근 불가"로 처리하여 유료 고객 차단

- **해결 (4가지 수정)**:
  1. **Webhook 수정** (routes.ts:685-695)
     - `cancel_at_period_end = true`일 때 status를 "canceled" 대신 "active"로 유지
     - period_end까지 접근 보장

  2. **cancelSubscription() 함수 수정** (subscription-service.ts:316-335)
     - periodEndDate가 미래면 "active" 유지
     - 과거면 "inactive"로 변경

  3. **Cron Job 수정** (cron-jobs.ts:62-98)
     - Stripe의 "canceled" 상태를 맹목적으로 복사하지 않음
     - period_end가 미래면 "active"로 유지

  4. **새 Cron Job 추가** (cron-jobs.ts:175-212)
     - 시간당 1회 실행 (매시 30분)
     - subscriptionEndDate 지난 "active" 구독을 "inactive"로 전환

- **추가 수정**:
  1. `/api/auth/login` (routes.ts:1269)에 `subscriptionEndDate` 추가
  2. `/api/auth/verify` (routes.ts:1734)에 `subscriptionEndDate` 추가
  3. 모든 컴포넌트를 AccessContext로 통일:
     - `free-zone-banner.tsx`
     - `trial-timer-banner.tsx`
     - `locked-trade-card.tsx`
     - `ranking.tsx`
  4. `premium-checkout.tsx`에 Card import 추가

## 중요 테스트 계정
- **scottnim7777@gmail.com**
  - Stripe subscription: `sub_1SRF1RQ9br8aQ595xOtjWRfv`
  - 구독 종료: 2025-12-08 (active 상태)
  - 비밀번호: `Ski0602021!@#$`

- **cosmic0602021@gmail.com**
  - 테스트용 계정

## 구독 로직 (중요!)
- `subscriptionStatus`가 `"canceled"`여도 `subscriptionEndDate`가 미래면 **프리미엄 접근 허용**
- `active`, `trialing`: endDate 체크 불필요
- `canceled`: endDate가 있고 미래일 때만 허용

## 절대 하지 말 것 ⛔
1. **"캐시/쿠키 삭제하세요" 류의 조언 금지**
   - 사용자는 여러 새 기기에서 테스트함
   - 브라우저 문제가 아님

2. **임시방편 수정 금지**
   - 특정 이메일만 수정하지 말 것
   - 근본 원인을 찾아 코드 레벨에서 영구 해결
   - 모든 미래 사용자에게 적용되도록

3. **가정하지 말 것**
   - 문제의 원인을 가정하지 말고 실제 조사
   - 데이터베이스, API 응답, 코드 로직 모두 확인

## 파일 구조
```
/home/runner/workspace/
├── client/src/
│   ├── contexts/
│   │   ├── access-context.tsx (액세스 레벨 관리)
│   │   └── auth-context.tsx (인증 관리)
│   ├── components/
│   └── pages/
├── server/
│   ├── routes.ts (API 엔드포인트)
│   └── subscription-service.ts (구독 로직)
└── shared/
    └── schema.ts (타입 정의)
```

## 배포 환경
- **플랫폼**: Replit
- **배포 방법**: Deploy 버튼 클릭
- **프로덕션 URL**: https://insiderpulse.pro

## 개발 팁
- 빌드: `npm run build`
- 서버는 tsx watch mode로 자동 재시작
- 프론트엔드 번들 파일명은 매 빌드마다 변경됨 (예: main-Ddny9Xbg.js)

## 마지막 빌드
- **날짜**: 2025-11-16
- **번들**: main-zZqGiBdH.js (클라이언트 변경 없음)
- **주요 변경사항**:
  - 구독 메커니즘 4가지 버그 수정
  - Webhook, cancelSubscription(), Cron Job 수정
  - 신규 subscription expiration check Cron Job 추가
