# 데이터 누락 방지 시스템 (Gap Prevention System)

## 📋 개요

InsiderPulse의 데이터 수집 시스템이 재시작되거나 중단되었을 때 자동으로 누락된 거래 데이터를 복구하는 시스템입니다.

## 🎯 해결된 문제

**이전 문제:**
- 서버 재시작 시 누락 기간의 데이터가 영구적으로 손실됨
- 수동으로 누락 데이터를 확인하고 복구해야 함
- 데이터 수집 실패를 감지할 방법이 없음
- 개발 모드에서 모니터링 시스템이 비활성화됨

**현재 해결책:**
- ✅ 서버 시작 시 자동 갭 감지
- ✅ 누락된 데이터 자동 백필
- ✅ 모든 수집 시도를 데이터베이스에 기록
- ✅ 개발/프로덕션 모두에서 모니터링 활성화
- ✅ PM2를 통한 안정적인 프로세스 관리

---

## 🏗️ 시스템 구조

### 1. 수집 추적 테이블 (collection_runs)

모든 데이터 수집 시도를 기록합니다.

```sql
CREATE TABLE collection_runs (
  id VARCHAR PRIMARY KEY,
  collector_name TEXT NOT NULL,  -- "openinsider" | "marketbeat" | "sec-rss"
  status TEXT NOT NULL,           -- "running" | "success" | "failure"
  trades_collected INTEGER,       -- 수집된 거래 수
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  error_message TEXT,             -- 실패 시 에러 메시지
  metadata JSON                   -- 추가 정보
);
```

### 2. 갭 감지 로직

**위치:** `server/backfill-missing-trades.ts`

**작동 방식:**
1. 데이터베이스에서 가장 최근 거래 시간 확인
2. 현재 시간과 비교하여 갭 계산
3. 1시간 이상 갭이 있으면 백필 실행

```typescript
async detectGap(): Promise<GapDetectionResult> {
  const recentTrades = await storage.getInsiderTrades(1);
  const lastTrade = recentTrades[0];
  const currentTime = new Date();

  const gapHours = (currentTime - lastTrade.filedDate) / (1000 * 60 * 60);
  return { hasGap: gapHours > 1, gapHours, ... };
}
```

### 3. 자동 백필 시스템

**백필 전략:**
```
갭 시간 → 예상 누락 거래 수 → 필요한 페이지 수
  1시간 → ~50 거래 → 1 페이지
  8시간 → ~400 거래 → 5 페이지
 24시간 → ~1,200 거래 → 12 페이지
```

**데이터 소스:**
- OpenInsider (주 소스): 최대 100 페이지
- MarketBeat (보조 소스): 최대 500 거래

### 4. 서버 시작 시 자동 복구

**위치:** `server/index.ts:130-145`

```typescript
setTimeout(async () => {
  const { backfillManager } = await import('./backfill-missing-trades');
  const result = await backfillManager.autoBackfill();

  if (result.gapDetected) {
    log(`✅ Gap recovery complete: ${result.tradesCollected} trades`);
  }
}, 10000); // 서버 시작 10초 후 실행
```

---

## 🔧 사용 방법

### 수동 백필 실행

```bash
# 갭 감지 및 자동 백필
npx tsx server/backfill-missing-trades.ts
```

**출력 예시:**
```
🚀 Running backfill script...

🔍 Checking for data collection gaps...
📊 Gap Detection Result: Gap detected: 8.2 hours since last trade
⚠️ GAP DETECTED: 8.2 hours
🔄 Starting backfill for 8.2 hour gap...
📊 Estimated 408 missing trades, fetching 5 pages...

🔵 Running OpenInsider backfill...
✅ OpenInsider backfill: 10 trades collected

🟢 Running MarketBeat backfill...
✅ MarketBeat backfill: 5 trades collected

✅ Total backfill complete: 15 trades collected

📊 Backfill Summary:
   Gap Detected: true
   Trades Collected: 15
```

### PM2로 안정적인 실행

```bash
# PM2 설치 (한 번만)
npm install -g pm2

# 프로덕션 모드로 시작
NODE_ENV=production pm2 start ecosystem.config.js

# 개발 모드로 시작
NODE_ENV=development pm2 start ecosystem.config.js

# 상태 확인
pm2 status

# 실시간 로그 보기
pm2 logs insiderpulse

# 모니터링 대시보드
pm2 monit

# 재시작
pm2 restart insiderpulse

# 중지
pm2 stop insiderpulse

# 자동 시작 설정 (서버 재부팅 시)
pm2 startup
pm2 save
```

### PM2 기능

- **자동 재시작**: 충돌 시 즉시 재시작
- **메모리 관리**: 500MB 초과 시 자동 재시작
- **로그 관리**: `logs/pm2-error.log`, `logs/pm2-out.log`
- **무중단 재시작**: `pm2 reload insiderpulse`

---

## 📊 모니터링

### 수집 상태 확인

**데이터베이스 쿼리:**
```sql
-- 최근 수집 시도 확인
SELECT * FROM collection_runs
ORDER BY started_at DESC
LIMIT 10;

-- 수집 성공률 확인
SELECT
  collector_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(trades_collected) as total_trades
FROM collection_runs
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY collector_name;

-- 실패한 수집 확인
SELECT * FROM collection_runs
WHERE status = 'failure'
ORDER BY started_at DESC;
```

### API 엔드포인트

**수집 상태 조회:**
```javascript
// GET /api/collection-runs/status
// 응답:
{
  "recentRuns": [
    {
      "collectorName": "openinsider",
      "status": "success",
      "tradesCollected": 10,
      "startedAt": "2025-10-30T12:00:00Z",
      "completedAt": "2025-10-30T12:00:15Z"
    }
  ],
  "stats": {
    "last24Hours": {
      "totalRuns": 48,
      "successful": 47,
      "failed": 1,
      "tradesCollected": 450
    }
  }
}
```

---

## ⚙️ 설정

### 갭 감지 임계값 변경

**파일:** `server/backfill-missing-trades.ts:49`

```typescript
// 기본값: 1시간
const hasGap = gapHours > 1;

// 예시: 30분으로 변경
const hasGap = gapHours > 0.5;
```

### 수집 빈도 변경

**파일:** `server/auto-scheduler.ts:78-112`

```typescript
// OpenInsider: 5분마다 (기본값)
setInterval(() => { ... }, 5 * 60 * 1000);

// MarketBeat: 30분마다 (기본값)
setInterval(() => { ... }, 30 * 60 * 1000);

// SEC RSS: 15분마다 (기본값)
setInterval(() => { ... }, 15 * 60 * 1000);
```

---

## 🚨 트러블슈팅

### 갭이 계속 발생하는 경우

1. **수집기 로그 확인:**
   ```bash
   pm2 logs insiderpulse --lines 100
   ```

2. **데이터베이스 연결 확인:**
   ```bash
   npm run db:push
   ```

3. **수동 수집 테스트:**
   ```bash
   npx tsx server/backfill-missing-trades.ts
   ```

### PM2가 시작되지 않는 경우

1. **포트 충돌 확인:**
   ```bash
   lsof -i :5000
   ```

2. **PM2 초기화:**
   ```bash
   pm2 delete all
   pm2 start ecosystem.config.js
   ```

3. **로그 확인:**
   ```bash
   pm2 logs --err
   ```

### 백필이 너무 느린 경우

**원인:** API 레이트 리밋

**해결책:**
- OpenInsider: 페이지당 2초 대기 (변경 불가)
- MarketBeat: 동시 요청 수 조정 가능

---

## 📈 성능 지표

### 예상 백필 시간

| 갭 기간 | 예상 거래 수 | 백필 시간 |
|---------|-------------|-----------|
| 1시간   | ~50         | 10초      |
| 8시간   | ~400        | 30초      |
| 24시간  | ~1,200      | 2분       |
| 7일     | ~8,400      | 15분      |

### 수집 용량

- **OpenInsider**: 최대 5,000 거래/백필 (50 페이지)
- **MarketBeat**: 최대 500 거래/백필
- **SEC RSS**: 최대 100 거래/수집

---

## 🔐 보안 고려사항

1. **Rate Limiting**: 각 수집기는 내장된 레이트 리밋 준수
2. **에러 격리**: 한 수집기 실패가 다른 수집기에 영향 없음
3. **중복 방지**: accessionNumber 유니크 제약으로 중복 방지
4. **Graceful Shutdown**: SIGTERM/SIGINT 시그널 처리

---

## 📝 향후 개선 사항

- [ ] Grafana 대시보드 추가
- [ ] 이메일/Slack 알림 시스템
- [ ] Redis 기반 작업 큐
- [ ] 다중 인스턴스 지원
- [ ] 자동 스케일링

---

## 📚 관련 파일

- `server/backfill-missing-trades.ts` - 백필 로직
- `server/auto-scheduler.ts` - 자동 수집 스케줄러
- `server/index.ts` - 서버 시작 시 갭 감지
- `shared/schema.ts` - collection_runs 테이블 스키마
- `ecosystem.config.js` - PM2 설정
- `server/crash-prevention-system.ts` - 크래시 방지
- `server/real-time-freshness-monitor.ts` - 데이터 신선도 모니터링

---

## 💡 도움말

문제가 계속되거나 추가 기능이 필요한 경우:
1. `collection_runs` 테이블 확인
2. PM2 로그 확인
3. 수동 백필 스크립트 실행
4. 데이터베이스 연결 확인

**중요:** 이 시스템은 자동으로 작동합니다. 일반적으로 수동 개입이 필요하지 않습니다!
