# InsiderPulse - App Store Compliance 작업 진행 상황

**마지막 업데이트**: 2025-11-27

---

## ✅ 완료된 작업

### Phase 1: 번역 파일 수정 (투자 조언 문구 제거)

#### 1. `client/src/lib/translations.ts`
- ✅ 영어(EN): "Strong Buy" → "High Buy Volume", "Recommended Stocks" → "Top Insider Activity"
- ✅ 한국어(KO): "강력 매수" → "높은 매수 거래량", "추천 주식" → "내부자 활동 TOP"
- ✅ 일본어(JA): "強い買い" → "高い買い取引量", "おすすめ銘柄" → "インサイダー活動トップ"
- ✅ 중국어(ZH): "强烈买入" → "高买入交易量", "推荐股票" → "内部人活动排行"
- ✅ AI Insights를 사실 기반으로 변경: "긍정적 신호" → "SEC 공시에 보고됨"
- ✅ 가격 타겟 레이블 변경: "목표가" → "애널리스트 전망치(존재 시)"

#### 2. `client/src/contexts/language-context.tsx`
- ✅ 영어 섹션: ranking.title, subtitle, recommendation 등 모두 변경
- ✅ 한국어 섹션: "추천매수 순위" → "내부자 활동 TOP", "추천 이유" → "활동 요약"
- ✅ 일본어 섹션: "トップ買い推奨" → "トップインサイダー活動"
- ✅ 중국어 섹션: "热门买入推荐" → "顶级内部人活动"
- ✅ AI Signal Feed 문구 변경: "시그널" → "거래 분석"
- ✅ tradeDetail 추천 문구 제거: "매수 추천" → "매수 활동"

---

## 🔄 진행 중인 작업

### Phase 2: 가격 타겟 시스템 재설계
**상태**: 파일 검색 완료, 수정 대기 중

**발견된 파일들**:
- `client/src/pages/ranking.tsx`
- `client/src/components/trade-detail-modal.tsx`
- `client/src/components/stock-summary-modal.tsx`
- `client/src/components/terminal-ui/TradeModal.tsx`
- `client/src/lib/advanced-ai-analyst.ts`

**수정 필요 사항**:
1. 앱 자체 가격 타겟 계산 로직 제거
2. 외부 애널리스트 데이터만 표시하도록 변경
3. 내부자 거래 가격 범위: "Reference Price Range (Historical)" 레이블 + 면책 문구

---

## 📋 다음 할 일 (우선순위)

### 우선순위 높음 (Phase 3)
- [ ] `server/ai-analysis.ts` AI 프롬프트 재설계
  - 투자 조언 제거
  - 사실 기반 요약만 생성
  - priceTargets 필드 삭제

### 우선순위 중간 (Phase 5)
- [ ] `client/src/components/disclaimer-modal.tsx` 생성
- [ ] `client/src/components/footer-disclaimer.tsx` 생성
- [ ] Main App에 Disclaimer 통합

### 우선순위 중간 (Phase 6)
- [ ] `client/index.html` 메타데이터 수정
  - description, JSON-LD schema 변경
  - "buy/sell signals" → "transaction categorization"

### 나중에 (Phase 2, 4, 7, 8)
- [ ] Phase 2: 가격 타겟 로직 완전 제거
- [ ] Phase 4: advanced-ai-analyst.ts 리팩토링
- [ ] Phase 7: DB 캐시 초기화 스크립트
- [ ] Phase 8: 검색 스크립트 생성
- [ ] 빌드 테스트 및 TypeScript 에러 확인

---

## 📊 현재 상태

**토큰 사용량**: ~110,000 / 200,000 (55%)
**예상 남은 작업**: Phase 3, 5, 6만 완료 예정 (Phase 2, 4는 다음 세션)

---

## 🔑 중요 변경 사항 요약

1. **투자 조언 문구 완전 제거**: 모든 "추천", "매수 신호", "강력 매수" 등 삭제
2. **데이터 기반 문구로 변경**: "AI 분석" → "데이터 요약", "신호" → "활동"
3. **사실 기반 AI Insights**: "긍정적 신호" → "SEC 공시에 기록됨"
4. **4개 언어 모두 동일하게 적용**: EN, KO, JA, ZH

---

## 💡 다음 세션에서 할 것

1. `/save` 명령어로 이 파일 업데이트
2. Phase 3 (AI 프롬프트) 작업
3. Phase 5, 6 (Disclaimer, 메타데이터) 작업
4. 중간 커밋 + 빌드 테스트
5. Phase 2, 4는 별도 세션에서 진행

---

**참고**: `/checkpoint [메시지]` - 빠른 커밋, `/save` - 진행 상황 저장
