import axios from 'axios';
import { storage } from './storage';

/**
 * Finnhub API를 사용한 내부자 거래 데이터 수집
 *
 * 무료 플랜: 60 API calls/minute
 * 회원가입: https://finnhub.io/register
 *
 * Finnhub는 내부자 거래 데이터를 무료로 제공합니다!
 */

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'demo';

interface FinnhubInsiderTransaction {
  name: string;
  symbol: string;
  transactionDate: string;
  filingDate: string;
  transactionPrice: number;
  share: number; // Shares owned after transaction
  change: number; // Net buying/selling (positive = buy, negative = sell)
  transactionCode: string;
}

interface FinnhubInsiderResponse {
  symbol: string;
  data: FinnhubInsiderTransaction[];
}

interface FinnhubNewsArticle {
  category: string;
  datetime: number; // Unix timestamp
  headline: string;
  id: number;
  image: string;
  related: string; // ticker symbol
  source: string;
  summary: string;
  url: string;
}

export interface CompanyNews {
  symbol: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  publishedDate: Date;
  category: string;
  imageUrl?: string;
}

// 주요 기업 리스트 (무료 플랜 제한 고려)
const MAJOR_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
  'BRK.B', 'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'UNH',
  'HD', 'DIS', 'BAC', 'ADBE', 'CRM', 'NFLX', 'INTC', 'AMD',
  'CSCO', 'PEP', 'COST', 'TMO', 'ABBV', 'AVGO', 'ORCL'
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

/**
 * Finnhub API를 사용하여 특정 기업의 최근 뉴스를 가져옵니다
 * @param symbol 주식 티커
 * @param daysBack 조회할 과거 일수 (기본: 30일)
 * @returns 뉴스 기사 배열
 */
export async function getCompanyNews(symbol: string, daysBack: number = 30): Promise<CompanyNews[]> {
  try {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);

    const formatDate = (date: Date) => date.toISOString().split('T')[0]; // YYYY-MM-DD

    const response = await axios.get<FinnhubNewsArticle[]>(
      `https://finnhub.io/api/v1/company-news`,
      {
        params: {
          symbol: symbol,
          from: formatDate(fromDate),
          to: formatDate(toDate),
          token: FINNHUB_API_KEY
        },
        timeout: 15000
      }
    );

    const articles = response.data || [];

    return articles.map(article => ({
      symbol: symbol,
      headline: article.headline,
      summary: article.summary,
      source: article.source,
      url: article.url,
      publishedDate: new Date(article.datetime * 1000), // Unix timestamp to Date
      category: article.category,
      imageUrl: article.image
    }));

  } catch (error: any) {
    if (error.response?.status === 429) {
      console.log(`   ⏸️  Rate limit - 잠시 대기...`);
      await delay(2000);
      return [];
    }
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.error(`   ❌ API 인증 실패 (뉴스 API는 유료 플랜이 필요할 수 있습니다)`);
      return [];
    }
    console.error(`   ❌ 뉴스 가져오기 실패: ${error.message}`);
    return [];
  }
}

async function collectFromFinnhub(tickerLimit: number = 30) {
  console.log('🐟 Finnhub API로 내부자 거래 데이터 수집...\n');
  console.log(`🔑 API Key: ${FINNHUB_API_KEY === 'demo' ? 'DEMO (테스트용)' : 'Custom'}\n`);

  if (FINNHUB_API_KEY === 'demo') {
    console.log('⚠️  DEMO 키 사용 중 - 실제 데이터를 가져오려면:');
    console.log('   1. https://finnhub.io/register 에서 무료 계정 생성');
    console.log('   2. API 키 발급받기 (무료!)');
    console.log('   3. .env 파일에 FINNHUB_API_KEY=your_key 추가');
    console.log('   4. 무료 플랜: 60 API calls/minute\n');
  }

  try {
    let totalSaved = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;
    let totalSkipped = 0;
    let processedTickers = 0;

    const tickers = MAJOR_TICKERS.slice(0, tickerLimit);
    console.log(`📊 ${tickers.length}개 주요 기업의 내부자 거래 수집 시작...\n`);

    for (const ticker of tickers) {
      try {
        console.log(`\n[${++processedTickers}/${tickers.length}] ${ticker} 처리 중...`);

        const transactions = await getInsiderTransactions(ticker);

        if (transactions.length === 0) {
          console.log(`   ⏭️  거래 데이터 없음`);
          await delay(1100); // Rate limit: 60/min = ~1초 간격
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
          await delay(1100);
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

            // 거래 타입 자동 감지 (change 값으로)
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

            // 데이터베이스에 저장
            await storage.createInsiderTrade({
              ticker: ticker,
              companyName: ticker, // Finnhub는 회사명을 제공하지 않으므로 ticker 사용
              traderName: txn.name || 'Unknown Insider',
              traderTitle: 'Insider', // Finnhub는 직책을 제공하지 않음
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
              verificationNotes: 'Data from Finnhub API'
            });

            totalSaved++;

            if (totalSaved <= 5 || totalSaved % 10 === 0) {
              console.log(`      ✅ ${txn.name}: ${tradeType} ${shares.toLocaleString()} shares @ $${price.toFixed(2)}`);
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

        await delay(1100); // Rate limit: 60/min

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

collectFromFinnhub(30)
  .then(() => {
    console.log('\n✨ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 실패:', error.message);
    process.exit(1);
  });
