/**
 * 실제 insider trading 데이터 수집 스크립트
 * 통합 스크래핑 시스템을 사용하여 SEC EDGAR, RSS, OpenInsider에서 데이터 수집
 */

import { unifiedScraperSystem } from './scrapers/unified-scraper-system';
import { storage } from './storage';

async function collectRealData() {
  console.log('🚀 실제 Insider Trading 데이터 수집 시작...\n');

  try {
    // 통합 스크래핑 시스템 실행
    console.log('📊 모든 소스에서 데이터 수집 중...');
    const trades = await unifiedScraperSystem.executeFullScraping();

    console.log(`\n✅ 총 ${trades.length}개의 거래 데이터 수집 완료`);

    if (trades.length === 0) {
      console.log('⚠️  수집된 데이터가 없습니다. 데이터 소스를 확인하세요.');
      return;
    }

    // 데이터베이스에 저장
    console.log('\n💾 데이터베이스에 저장 중...');
    let savedCount = 0;

    for (const trade of trades) {
      try {
        // InsiderTrade 형식으로 변환
        const insiderTrade = {
          ticker: trade.ticker,
          companyName: trade.companyName,
          traderName: trade.insiderName,
          traderTitle: trade.title,
          transactionDate: trade.transactionDate ? new Date(trade.transactionDate).toISOString() : undefined,
          filedDate: trade.filingDate ? new Date(trade.filingDate).toISOString() : new Date().toISOString(),
          tradeType: trade.transactionType,
          pricePerShare: trade.pricePerShare || 0,
          shares: trade.shares || 0,
          totalValue: trade.totalValue || 0,
          sharesOwnedAfter: trade.sharesOwnedAfter,
          accessionNumber: trade.accessionNumber || `${trade.source.toLowerCase()}-${trade.ticker}-${Date.now()}`,
          secFilingUrl: trade.secLink || trade.sourceUrl,
          // 추가 필드들
          isClusterBuy: false,
          hasUnusualTiming: false,
        };

        await storage.createInsiderTrade(insiderTrade);
        savedCount++;
      } catch (error) {
        console.error(`❌ 저장 실패 (${trade.ticker}):`, error);
        console.error('Trade data:', JSON.stringify(trade, null, 2));
      }
    }

    console.log(`\n✅ ${savedCount}개 거래 데이터 저장 완료`);

    // 저장된 데이터 확인
    const allTrades = await storage.getInsiderTrades(10);
    console.log(`\n📊 데이터베이스 샘플 (최근 10개):`);
    allTrades.forEach((trade, i) => {
      console.log(`${i + 1}. ${trade.companyName} (${trade.ticker}) - ${trade.traderName}`);
      console.log(`   ${trade.tradeType} | $${trade.totalValue.toLocaleString()} | ${trade.filedDate}`);
    });

  } catch (error) {
    console.error('❌ 데이터 수집 실패:', error);
    throw error;
  }
}

collectRealData()
  .then(() => {
    console.log('\n✨ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 실패:', error);
    process.exit(1);
  });
