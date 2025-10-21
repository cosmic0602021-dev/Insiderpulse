import axios from 'axios';
import { storage } from './storage';

/**
 * Financial Modeling Prep API를 사용한 내부자 거래 데이터 수집
 *
 * 무료 플랜: 250 requests/day (insider trading endpoint는 유료 플랜 필요할 수 있음)
 * Starter 플랜: $22/month - insider trading 포함
 *
 * API 키 발급: https://site.financialmodelingprep.com/developer/docs
 */

const FMP_API_KEY = process.env.FMP_API_KEY || 'demo'; // demo 키로 테스트

interface FMPInsiderTrade {
  symbol: string;
  companyName?: string;
  filingDate: string;
  transactionDate: string;
  reportingName: string;
  typeOfOwner: string;
  transactionType: string;
  securitiesOwned: number;
  securitiesTransacted: number;
  price: number;
  securityName: string;
  link: string;
}

async function collectFromFMP(limit: number = 50) {
  console.log('💰 Financial Modeling Prep API로 내부자 거래 데이터 수집...\n');
  console.log(`🔑 API Key: ${FMP_API_KEY === 'demo' ? 'DEMO (제한적)' : 'Custom'}\n`);

  if (FMP_API_KEY === 'demo') {
    console.log('⚠️  DEMO 키 사용 중 - 실제 데이터를 가져오려면:');
    console.log('   1. https://site.financialmodelingprep.com/developer/docs 에서 무료 계정 생성');
    console.log('   2. API 키 발급받기');
    console.log('   3. .env 파일에 FMP_API_KEY=your_key 추가');
    console.log('   4. Insider trading은 Starter 플랜($22/월) 이상 필요\n');
  }

  try {
    // FMP Insider Trading RSS Feed (무료)
    console.log('📡 FMP Insider Trading RSS 피드 가져오는 중...');
    const rssResponse = await axios.get(
      `https://financialmodelingprep.com/api/v4/insider-trading-rss-feed?page=0&apikey=${FMP_API_KEY}`,
      { timeout: 30000 }
    );

    console.log(`✅ ${rssResponse.data.length || 0}개의 거래 데이터 수신\n`);

    if (!rssResponse.data || rssResponse.data.length === 0) {
      console.log('❌ 데이터 없음 - API 키를 확인하거나 유료 플랜이 필요할 수 있습니다.');
      return;
    }

    let savedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    const trades: FMPInsiderTrade[] = rssResponse.data.slice(0, limit);

    for (const trade of trades) {
      try {
        // Transaction type 변환
        let tradeType = 'OTHER';
        const txType = (trade.transactionType || '').toUpperCase();

        if (txType.includes('P-PURCHASE') || txType.includes('BUY')) {
          tradeType = 'PURCHASE';
        } else if (txType.includes('S-SALE') || txType.includes('SELL')) {
          tradeType = 'SALE';
        } else if (txType.includes('A-AWARD')) {
          tradeType = 'AWARD';
        } else if (txType.includes('M-EXEMPTION')) {
          tradeType = 'OPTION_EXERCISE';
        } else if (txType.includes('G-GIFT')) {
          tradeType = 'GIFT';
        }

        const shares = Math.abs(trade.securitiesTransacted || 0);
        const price = trade.price || 0;
        const totalValue = shares * price;

        // 유효성 검사
        if (shares === 0 || totalValue === 0) {
          console.log(`⏭️  ${trade.symbol} - 건너뜀 (0 값)`);
          continue;
        }

        // 데이터베이스에 저장
        await storage.createInsiderTrade({
          ticker: trade.symbol,
          companyName: trade.companyName || trade.symbol,
          traderName: trade.reportingName || 'Unknown',
          traderTitle: trade.typeOfOwner || 'Insider',
          filedDate: new Date(trade.filingDate),
          tradeType: tradeType as any,
          shares: shares,
          pricePerShare: price,
          totalValue: totalValue,
          accessionNumber: `fmp-${trade.symbol}-${trade.filingDate}`,
          secFilingUrl: trade.link || '',
          isVerified: true,
          verificationStatus: 'VERIFIED',
          verificationNotes: 'Data from Financial Modeling Prep API'
        });

        savedCount++;
        console.log(`✅ ${trade.symbol} - ${trade.reportingName}`);
        console.log(`   ${tradeType}: ${shares.toLocaleString()} shares @ $${price.toFixed(2)}`);
        console.log(`   Total: $${totalValue.toLocaleString()}`);

      } catch (error: any) {
        if (error?.code === '23505') {
          duplicateCount++;
        } else {
          errorCount++;
          console.error(`❌ 저장 실패 (${trade.symbol}):`, error.message);
        }
      }
    }

    console.log(`\n\n📊 수집 완료:`);
    console.log(`   ✅ 새로 저장: ${savedCount}개`);
    console.log(`   🔄 중복: ${duplicateCount}개`);
    console.log(`   ❌ 오류: ${errorCount}개`);

    // 저장된 데이터 확인
    const allTrades = await storage.getInsiderTrades(10);
    console.log(`\n📈 데이터베이스에 저장된 최근 10개:`);
    allTrades.forEach((trade, i) => {
      console.log(`\n${i + 1}. ${trade.companyName} (${trade.ticker})`);
      console.log(`   ${trade.tradeType}: ${trade.shares.toLocaleString()} shares @ $${trade.pricePerShare.toFixed(2)}`);
      console.log(`   Total: $${trade.totalValue.toLocaleString()}`);
      console.log(`   Trader: ${trade.traderName} (${trade.traderTitle})`);
    });

  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('\n❌ API 키 인증 실패');
      console.error('   https://site.financialmodelingprep.com/developer/docs 에서 API 키 발급 필요');
    } else if (error.response?.status === 403) {
      console.error('\n❌ 접근 거부 - Insider Trading 데이터는 유료 플랜 필요');
      console.error('   Starter 플랜($22/월)으로 업그레이드하세요');
      console.error('   https://site.financialmodelingprep.com/pricing-plans');
    } else {
      console.error('\n❌ 수집 실패:', error.message);
      if (error.response?.data) {
        console.error('   응답:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

collectFromFMP(50)
  .then(() => {
    console.log('\n✨ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 실패:', error.message);
    process.exit(1);
  });
