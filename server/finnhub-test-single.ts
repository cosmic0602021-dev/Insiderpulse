import axios from 'axios';
import { storage } from './storage';

/**
 * Finnhub API 테스트 - AAPL 1개 기업만
 */

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd3rgqf1r01qopgh8fgj0d3rgqf1r01qopgh8fgjg';

async function testFinnhubWithApple() {
  console.log('🍎 Apple (AAPL) 내부자 거래 데이터 수집 테스트...\n');

  try {
    // 1. Company Profile 가져오기
    console.log('📊 회사 정보 가져오는 중...');
    const profileResponse = await axios.get(
      `https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=${FINNHUB_API_KEY}`
    );

    const profile = profileResponse.data;
    console.log(`✅ 회사명: ${profile.name}`);
    console.log(`✅ 로고: ${profile.logo}`);
    console.log(`✅ 산업: ${profile.finnhubIndustry}\n`);

    // 2. Insider Transactions 가져오기
    console.log('📈 내부자 거래 가져오는 중...');
    const transactionsResponse = await axios.get(
      `https://finnhub.io/api/v1/stock/insider-transactions?symbol=AAPL&token=${FINNHUB_API_KEY}`
    );

    const transactions = transactionsResponse.data.data || [];
    console.log(`✅ 총 ${transactions.length}개 거래 발견\n`);

    // 최근 30일 거래 필터링
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTrades = transactions
      .filter((t: any) => new Date(t.transactionDate) > thirtyDaysAgo)
      .filter((t: any) => Math.abs(t.change) > 0 && t.transactionPrice > 0)
      .slice(0, 5); // 최신 5개만

    console.log(`📅 최근 30일 내 유효한 거래: ${recentTrades.length}개\n`);
    console.log('=' .repeat(80));

    let savedCount = 0;

    for (const txn of recentTrades) {
      // Transaction code 변환
      let tradeType = 'OTHER';
      const shares = Math.abs(txn.change);

      switch (txn.transactionCode) {
        case 'P': tradeType = 'PURCHASE'; break;
        case 'S': tradeType = 'SALE'; break;
        case 'A': tradeType = txn.change > 0 ? 'AWARD' : 'ACQUISITION'; break;
        case 'D': tradeType = 'DISPOSITION'; break;
        case 'M': tradeType = 'OPTION_EXERCISE'; break;
        case 'F': tradeType = 'TAX_PAYMENT'; break;
      }

      if (tradeType === 'OTHER' && txn.change !== 0) {
        tradeType = txn.change > 0 ? 'PURCHASE' : 'SALE';
      }

      const totalValue = shares * txn.transactionPrice;

      console.log(`\n🔵 거래 #${savedCount + 1}:`);
      console.log(`   👤 ${txn.name}`);
      console.log(`   📊 ${tradeType}: ${shares.toLocaleString()} shares @ $${txn.transactionPrice.toFixed(2)}`);
      console.log(`   💰 총액: $${totalValue.toLocaleString()}`);
      console.log(`   📅 거래일: ${txn.transactionDate}`);
      console.log(`   📝 제출일: ${txn.filingDate}`);
      console.log(`   📈 거래 후 보유: ${txn.share.toLocaleString()} shares`);

      try {
        // 데이터베이스에 저장
        await storage.createInsiderTrade({
          ticker: 'AAPL',
          companyName: profile.name,
          traderName: txn.name,
          traderTitle: 'Insider',
          filedDate: new Date(txn.filingDate),
          tradeType: tradeType as any,
          shares: shares,
          pricePerShare: txn.transactionPrice,
          totalValue: totalValue,
          sharesOwnedAfter: txn.share,
          accessionNumber: `finnhub-AAPL-${txn.filingDate}-${txn.name.replace(/\s+/g, '-')}`,
          secFilingUrl: '',
          isVerified: true,
          verificationStatus: 'VERIFIED',
          verificationNotes: `Finnhub API | Logo: ${profile.logo}`
        });

        console.log(`   ✅ 데이터베이스에 저장 완료!`);
        savedCount++;

      } catch (error: any) {
        if (error?.code === '23505') {
          console.log(`   ⏭️  이미 존재 (중복)`);
        } else {
          console.error(`   ❌ 저장 실패: ${error.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ 총 ${savedCount}개 거래 저장 완료!\n`);

    // 저장된 데이터 확인
    const allTrades = await storage.getInsiderTrades(10);
    console.log('📈 데이터베이스에 저장된 최근 10개:\n');

    allTrades.forEach((trade, i) => {
      console.log(`${i + 1}. ${trade.companyName} (${trade.ticker})`);
      console.log(`   👤 ${trade.traderName}`);
      console.log(`   📊 ${trade.tradeType}: ${trade.shares.toLocaleString()} shares @ $${trade.pricePerShare.toFixed(2)}`);
      console.log(`   💰 $${trade.totalValue.toLocaleString()}`);
      console.log(`   📅 ${new Date(trade.filedDate).toLocaleDateString()}\n`);
    });

  } catch (error: any) {
    console.error('❌ 오류:', error.message);
    if (error.response?.data) {
      console.error('응답:', error.response.data);
    }
  }
}

testFinnhubWithApple()
  .then(() => {
    console.log('✨ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 실패:', error.message);
    process.exit(1);
  });
