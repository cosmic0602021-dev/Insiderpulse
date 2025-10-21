# 📊 내부자 거래 데이터 수집 가이드

## 🔍 문제 발견
- **569개의 가짜 데이터** 발견 및 삭제 완료
- 모든 거래가 $0, 0 shares, 거래 타입 없음
- 회사 아이콘/티커 누락
- 매수/매도 정보 없음

## ✅ 해결 방법

---

## 🏆 최종 추천: Finnhub API (무료!) ⭐

### 💚 완전 무료 옵션

**Finnhub** - 내부자 거래 데이터를 **무료**로 제공!

### 가격:
- **무료 플랜**: ✅ **완전 무료!**
  - 60 API calls/minute
  - Insider trading 데이터 포함
  - 회원가입만으로 사용 가능

### 포함되는 데이터:
- ✅ 거래자 이름 (`name`)
- ✅ 거래 타입 (매수/매도) (`transactionCode`, `change`)
- ✅ 주식 수 (`change`)
- ✅ 거래 가격 (`transactionPrice`)
- ✅ 거래 후 보유 주식 수 (`share`)
- ✅ 거래일/제출일 (`transactionDate`, `filingDate`)
- ✅ 티커 심볼 (`symbol`)
- ⚠️ 회사명 미포함 (티커만 제공)
- ⚠️ 직책 미포함

### 사용 방법:
```bash
# 1. 무료 계정 생성 및 API 키 발급
https://finnhub.io/register

# 2. .env 파일에 키 추가
FINNHUB_API_KEY=your_api_key_here

# 3. 데이터 수집 실행
npx tsx server/finnhub-collector.ts
```

### API 예제:
```bash
# Insider transactions
GET https://finnhub.io/api/v1/stock/insider-transactions?symbol=AAPL&token=YOUR_KEY
```

### 장점:
- ✅ **완전 무료**
- ✅ 내부자 거래 데이터 포함
- ✅ 60 calls/minute (충분함)
- ✅ 안정적인 API
- ✅ 좋은 문서

### 단점:
- ⚠️ 회사명을 별도로 가져와야 함 (ticker → company name 변환 필요)
- ⚠️ 직책 정보 없음 (모두 "Insider"로 표시)
- ⚠️ 회사 로고를 별도 API로 가져와야 함

---

## 💰 유료 API 옵션 (더 완전한 데이터)

## 1️⃣ Financial Modeling Prep (FMP)

### 가격:
- **무료 플랜**: 250 requests/day (insider trading 미포함)
- **Starter 플랜**: **$22/월** (연간 결제 시)
  - ✅ Insider trading 전체 액세스
  - 300 API calls/minute
  - 5년 히스토리 데이터
  - US 시장 커버리지

### 장점:
- ✅ 완전한 내부자 거래 데이터
- ✅ 거래 타입 (매수/매도)
- ✅ 실시간 업데이트
- ✅ 가격, 주식 수, 회사 정보 모두 포함
- ✅ 안정적인 API
- ✅ 좋은 문서

### 사용 방법:
```bash
# 1. 계정 생성 및 API 키 발급
https://site.financialmoderingprep.com/developer/docs

# 2. .env 파일에 키 추가
FMP_API_KEY=your_api_key_here

# 3. 데이터 수집 실행
npx tsx server/fmp-collector.ts
```

### API 예제:
```typescript
// Latest insider trading
GET https://financialmodelingprep.com/api/v4/insider-trading-rss-feed?page=0&apikey=YOUR_KEY

// Search by symbol
GET https://financialmodelingprep.com/api/v4/insider-trading?symbol=AAPL&page=0&apikey=YOUR_KEY
```

---

## 2️⃣ sec-api.io

### 가격:
- **문의 필요** (가격 정보 공개되지 않음)
- Form 4 데이터 전문

### 장점:
- ✅ Form 3, 4, 5 전체 지원
- ✅ 2009년부터 현재까지 모든 데이터
- ✅ 300ms 이내 새 데이터 인덱싱
- ✅ Bulk download 지원

### 단점:
- ❌ 가격 불명확
- ❌ 무료 플랜 없음

---

## 3️⃣ Polygon.io

### 가격:
- **$25/월**

### 단점:
- ❌ **Insider trading 데이터 없음**
- 주가 데이터만 제공

---

## 📝 최종 추천

### 🥇 1순위: Financial Modeling Prep Starter ($22/월)
**이유**:
- 가장 저렴한 유료 옵션
- 완전한 insider trading 데이터
- 안정적이고 사용하기 쉬움
- 좋은 문서화

### 🥈 2순위: 무료로 계속 시도
SEC EDGAR 파서를 더 개선하거나 다른 무료 소스 찾기
- OpenInsider.com HTML 파싱 수정
- SEC EDGAR XML 파서 개선
- 다른 무료 데이터 소스 찾기

---

## 🚀 구현 파일

### 준비된 collectors:
1. **`server/finnhub-collector.ts`** - Finnhub API (무료, 추천!) ⭐⭐⭐
2. **`server/fmp-collector.ts`** - FMP API (유료 $22/월) ⭐⭐
3. **`server/sec-edgar-real-collector.ts`** - SEC EDGAR (무료, 불안정) ⭐
4. **`server/clear-all-data.ts`** - 가짜 데이터 삭제

### 실행 방법:
```bash
# Finnhub API 사용 (무료!) - 추천
FINNHUB_API_KEY=your_key npx tsx server/finnhub-collector.ts

# FMP API 사용 (유료 $22/월)
FMP_API_KEY=your_key npx tsx server/fmp-collector.ts

# SEC EDGAR 무료 (불안정)
npx tsx server/sec-edgar-real-collector.ts

# 가짜 데이터 삭제
npx tsx server/clear-all-data.ts
```

---

## 💡 결론

**무료로 작동하는 방법이 있습니다: Finnhub! 🎉**

### Finnhub (무료):
- ✅ 완전 무료
- ✅ 핵심 내부자 거래 데이터 모두 포함
- ✅ 매수/매도, 가격, 주식 수, 거래자 이름
- ✅ 60 API calls/minute
- ⚠️ 회사명, 직책은 별도 처리 필요

### FMP ($22/월):
- ✅ 더 완전한 데이터 (회사명, 직책 포함)
- ✅ 더 높은 API 제한
- 💰 비용 발생

**추천: Finnhub 무료 플랜으로 시작하고, 나중에 필요하면 FMP로 업그레이드!**

---

## 📞 시작하기:
1. **Finnhub 무료 계정**: https://finnhub.io/register
2. API 키 발급 (무료!)
3. `.env`에 `FINNHUB_API_KEY=your_key` 추가
4. `npx tsx server/finnhub-collector.ts` 실행

간단합니다! 🚀
