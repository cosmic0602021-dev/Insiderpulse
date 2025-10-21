import axios from 'axios';
import { storage } from './storage';

/**
 * Finnhub API를 사용한 내부자 거래 데이터 수집 (개선 버전)
 *
 * 회사명과 로고도 함께 수집!
 *
 * 무료 플랜: 60 API calls/minute
 * 회원가입: https://finnhub.io/register
 */

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'demo';

interface FinnhubInsiderTransaction {
  name: string;
  symbol: string;
  transactionDate: string;
  filingDate: string;
  transactionPrice: number;
  share: number;
  change: number;
  transactionCode: string;
}

interface FinnhubInsiderResponse {
  symbol: string;
  data: FinnhubInsiderTransaction[];
}

interface CompanyProfile {
  name: string;
  logo: string;
  ticker: string;
  weburl: string;
  finnhubIndustry: string;
}

// 주요 기업 리스트
const MAJOR_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
  'BRK.B', 'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'UNH',
  'HD', 'DIS', 'BAC', 'ADBE', 'CRM', 'NFLX', 'INTC', 'AMD',
  'CSCO', 'PEP', 'COST', 'TMO', 'ABBV', 'AVGO', 'ORCL'
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 회사 프로필 캐시 (API 호출 절약)
const companyProfileCache = new Map<string, CompanyProfile>();

async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  // 캐시 확인
  if (companyProfileCache.has(symbol)) {
    return companyProfileCache.get(symbol)!;
  }

  try {
    const response = await axios.get<CompanyProfile>(
      `https://finnhub.io/api/v1/stock/profile2`,
      {
        params: {
          symbol: symbol,
          token: FINNHUB_API_KEY
        },
        timeout: 15000
      }
    );

    if (response.data && response.data.name) {
      companyProfileCache.set(symbol, response.data);
      return response.data;
    }

    return null;
  } catch (error: any) {
    if (error.response?.status === 429) {
      console.log(`   ⏸️  Rate limit - 잠시 대기...`);
      await delay(2000);
    }
    return null;
  }
}

async function getInsiderTransactions(symbol: string): Promise<FinnhubInsiderTransaction[]> {
  try {
    const response = await axios.get<FinnhubInsiderResponse>(
      `https://finnhub.io/api/v1/stock/insider-transactions`,
      {
        params: {
          symbol: symbol,
          token: FINNHUB_API_KEY
        },
        timeout: 15000
      }
    );

    return response.data.data || [];
  } catch (error: any) {
    if (error.response?.status === 429) {
      console.log(`   ⏸️  Rate limit - 잠시 대기...`);
      await delay(2000);
      return [];
    }
    throw error;
  }
}

async function collectFromFinnhubEnhanced(tickerLimit: number = 30) {
  console.log('🐟 Finnhub API로 내부자 거래 데이터 수집 (개선 버전)...\n');
  console.log(`🔑 API Key: ${FINNHUB_API_KEY === 'demo' ? 'DEMO (테스트용)' : 'Custom'}\n`);

  if (FINNHUB_API_KEY === 'demo') {
    console.log('⚠️  DEMO 키 사용 중 - 실제 데이터를 가져오려면:');
    console.log('   1. https://finnhub.io/register 에서 무료 계정 생성');
    console.log('   2. API 키 발급받기 (무료!)');
    console.log('   3. .env 파일에 FINNHUB_API_KEY=your_key 추가\n');
  }

  try {
    let totalSaved = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;
    let totalSkipped = 0;
    let processedTickers = 0;

    const tickers = MAJOR_TICKERS.slice(0, tickerLimit);
    console.log(`📊 ${tickers.length}개 주요 기업의 내부자 거래 + 회사 정보 수집 시작...\n`);

    for (const ticker of tickers) {
      try {
        console.log(`\n[${++processedTickers}/${tickers.length}] ${ticker} 처리 중...`);

        // 1. 회사 프로필 가져오기 (회사명, 로고 포함)
        const profile = await getCompanyProfile(ticker);
        await delay(600); // Rate limit 준수

        if (!profile) {
          console.log(`   ⚠️  회사 프로필 없음`);
        } else {
          console.log(`   ✅ 회사: ${profile.name}`);
          if (profile.logo) {
            console.log(`   🖼️  로고: ${profile.logo}`);
          }
        }

        // 2. 내부자 거래 가져오기
        const transactions = await getInsiderTransactions(ticker);
        await delay(600); // Rate limit 준수

        if (transactions.length === 0) {
          console.log(`   ⏭️  거래 데이터 없음`);
          continue;
        }

        console.log(`   ✅ ${transactions.length}개 거래 발견`);

        // 최근 30일 거래만 필터링
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentTransactions = transactions.filter(t =>
          new Date(t.transactionDate) > thirtyDaysAgo
        );

        if (recentTransactions.length === 0) {
          console.log(`   ⏭️  최근 30일 내 거래 없음`);
          continue;
        }

        console.log(`   📅 최근 30일: ${recentTransactions.length}개`);

        for (const txn of recentTransactions) {
          try {
            // Transaction code를 거래 타입으로 변환
            let tradeType = 'OTHER';
            const shares = Math.abs(txn.change || 0);

            switch (txn.transactionCode) {
              case 'P':
                tradeType = 'PURCHASE';
                break;
              case 'S':
                tradeType = 'SALE';
                break;
              case 'A':
                tradeType = txn.change > 0 ? 'AWARD' : 'ACQUISITION';
                break;
              case 'D':
                tradeType = 'DISPOSITION';
                break;
              case 'G':
                tradeType = 'GIFT';
                break;
              case 'M':
                tradeType = 'OPTION_EXERCISE';
                break;
              case 'F':
                tradeType = 'TAX_PAYMENT';
                break;
            }

            // 거래 타입 자동 감지
            if (tradeType === 'OTHER' && txn.change !== 0) {
              tradeType = txn.change > 0 ? 'PURCHASE' : 'SALE';
            }

            const price = txn.transactionPrice || 0;
            const totalValue = shares * price;

            // 유효성 검사
            if (shares === 0 || totalValue === 0) {
              totalSkipped++;
              continue;
            }

            // 데이터베이스에 저장 (회사명과 로고 포함!)
            await storage.createInsiderTrade({
              ticker: ticker,
              companyName: profile?.name || ticker,
              traderName: txn.name || 'Unknown Insider',
              traderTitle: 'Insider',
              filedDate: new Date(txn.filingDate),
              tradeType: tradeType as any,
              shares: shares,
              pricePerShare: price,
              totalValue: totalValue,
              sharesOwnedAfter: txn.share,
              accessionNumber: `finnhub-${ticker}-${txn.filingDate}-${txn.name}`,
              secFilingUrl: '',
              isVerified: true,
              verificationStatus: 'VERIFIED',
              verificationNotes: `Finnhub API | Logo: ${profile?.logo || 'N/A'}`
            });

            totalSaved++;

            if (totalSaved <= 5 || totalSaved % 10 === 0) {
              console.log(`      ✅ ${txn.name}: ${tradeType} ${shares.toLocaleString()} @ $${price.toFixed(2)}`);
            }

          } catch (error: any) {
            if (error?.code === '23505') {
              totalDuplicates++;
            } else {
              totalErrors++;
              if (totalErrors <= 3) {
                console.error(`      ❌ 저장 실패: ${error.message}`);
              }
            }
          }
        }

      } catch (error: any) {
        console.error(`   ❌ ${ticker} 처리 실패: ${error.message}`);
        totalErrors++;
        await delay(1100);
      }
    }

    console.log(`\n\n📊 수집 완료:`);
    console.log(`   ✅ 새로 저장: ${totalSaved}개`);
    console.log(`   🔄 중복: ${totalDuplicates}개`);
    console.log(`   ⏭️  건너뜀: ${totalSkipped}개`);
    console.log(`   ❌ 오류: ${totalErrors}개`);

    // 저장된 데이터 확인
    if (totalSaved > 0) {
      const allTrades = await storage.getInsiderTrades(10);
      console.log(`\n📈 데이터베이스에 저장된 최근 10개:`);
      allTrades.forEach((trade, i) => {
        console.log(`\n${i + 1}. ${trade.companyName} (${trade.ticker})`);
        console.log(`   ${trade.tradeType}: ${trade.shares.toLocaleString()} shares @ $${trade.pricePerShare.toFixed(2)}`);
        console.log(`   Total: $${trade.totalValue.toLocaleString()}`);
        console.log(`   Trader: ${trade.traderName}`);
        console.log(`   Filed: ${new Date(trade.filedDate).toLocaleDateString()}`);
        if (trade.verificationNotes?.includes('Logo:')) {
          const logoMatch = trade.verificationNotes.match(/Logo: (.+)/);
          if (logoMatch && logoMatch[1] !== 'N/A') {
            console.log(`   🖼️  Logo: ${logoMatch[1]}`);
          }
        }
      });
    }

  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('\n❌ API 키 인증 실패');
      console.error('   https://finnhub.io/register 에서 무료 API 키 발급 받으세요');
    } else {
      console.error('\n❌ 수집 실패:', error.message);
      if (error.response?.data) {
        console.error('   응답:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

collectFromFinnhubEnhanced(30)
  .then(() => {
    console.log('\n✨ 완료!');
    console.log('\n💡 다음 단계:');
    console.log('   1. 회사 로고는 verificationNotes 필드에 저장되어 있습니다');
    console.log('   2. 프론트엔드에서 로고 URL을 추출해서 표시하세요');
    console.log('   3. 예: <img src={trade.verificationNotes.match(/Logo: (.+)/)?.[1]} />');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 실패:', error.message);
    process.exit(1);
  });
