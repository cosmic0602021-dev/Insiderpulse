import axios from 'axios';
import { storage } from './storage';

/**
 * SEC EDGAR API에서 실제 최신 insider trading 데이터 수집
 * SEC 공식 API 사용: https://www.sec.gov/cgi-bin/browse-edgar
 */

interface SecFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  acceptanceDateTime: string;
  act: string;
  form: string;
  fileNumber: string;
  filmNumber: string;
  items: string;
  size: number;
  isXBRL: number;
  isInlineXBRL: number;
  primaryDocument: string;
  primaryDocDescription: string;
}

interface SecCompanyFilings {
  cik: string;
  entityType: string;
  sic: string;
  sicDescription: string;
  insiderTransactionForOwnerExists: number;
  insiderTransactionForIssuerExists: number;
  name: string;
  tickers: string[];
  exchanges: string[];
  ein: string;
  description: string;
  website: string;
  investorWebsite: string;
  category: string;
  fiscalYearEnd: string;
  stateOfIncorporation: string;
  stateOfIncorporationDescription: string;
  addresses: any;
  phone: string;
  flags: string;
  formerNames: any[];
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      acceptanceDateTime: string[];
      act: string[];
      form: string[];
      fileNumber: string[];
      filmNumber: string[];
      items: string[];
      size: number[];
      isXBRL: number[];
      isInlineXBRL: number[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
  };
}

async function fetchRealSecData() {
  console.log('🏛️ SEC EDGAR에서 실제 최신 insider trading 데이터 수집 중...\n');

  // SEC API 요청 헤더 (User-Agent 필수)
  const headers = {
    'User-Agent': 'InsiderTrack contact@insidertrack.com',
    'Accept-Encoding': 'gzip, deflate',
    'Host': 'data.sec.gov'
  };

  // 주요 기업들의 CIK 번호
  const companies = [
    { name: 'Apple Inc', ticker: 'AAPL', cik: '0000320193' },
    { name: 'Microsoft Corporation', ticker: 'MSFT', cik: '0000789019' },
    { name: 'NVIDIA Corporation', ticker: 'NVDA', cik: '0001045810' },
    { name: 'Tesla Inc', ticker: 'TSLA', cik: '0001318605' },
    { name: 'Amazon.com Inc', ticker: 'AMZN', cik: '0001018724' },
    { name: 'Meta Platforms Inc', ticker: 'META', cik: '0001326801' },
    { name: 'Alphabet Inc', ticker: 'GOOGL', cik: '0001652044' },
    { name: 'Advanced Micro Devices Inc', ticker: 'AMD', cik: '0000002488' },
  ];

  let totalSaved = 0;

  try {
    for (const company of companies) {
      try {
        console.log(`\n📊 ${company.name} (${company.ticker}) 데이터 수집 중...`);

        // SEC API에서 회사의 최근 제출 데이터 가져오기
        const url = `https://data.sec.gov/submissions/CIK${company.cik}.json`;

        const response = await axios.get<SecCompanyFilings>(url, {
          headers,
          timeout: 30000
        });

        const filings = response.data.filings.recent;

        // Form 4 (insider trading) 제출만 필터링
        const form4Indices: number[] = [];
        filings.form.forEach((form, index) => {
          if (form === '4') {
            form4Indices.push(index);
          }
        });

        console.log(`   📝 Form 4 제출 ${form4Indices.length}개 발견`);

        // 최근 5개의 Form 4만 처리
        const recentForm4s = form4Indices.slice(0, 5);

        for (const index of recentForm4s) {
          try {
            const filingDate = filings.filingDate[index];
            const accessionNumber = filings.accessionNumber[index];

            // SEC 파일링 URL 생성
            const accessionNumberNoHyphens = accessionNumber.replace(/-/g, '');
            const secUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${company.cik}&type=4&dateb=&owner=include&count=100`;

            // 기본 거래 데이터 생성 (실제 Form 4 XML 파싱은 복잡하므로 기본 정보만 저장)
            const trade = {
              ticker: company.ticker,
              companyName: company.name,
              traderName: 'Insider', // Form 4 XML을 파싱해야 실제 이름을 얻을 수 있음
              traderTitle: 'Officer/Director',
              filedDate: new Date(filingDate),
              tradeType: 'OTHER' as const, // Form 4 XML을 파싱해야 실제 거래 유형을 알 수 있음
              pricePerShare: 0,
              shares: 0,
              totalValue: 0,
              accessionNumber: accessionNumber,
              secFilingUrl: secUrl,
            };

            await storage.createInsiderTrade(trade);
            totalSaved++;

            console.log(`   ✅ ${filingDate} - ${accessionNumber.substring(0, 20)}...`);

          } catch (error: any) {
            if (error?.code === '23505') {
              // 중복 - 무시
            } else {
              console.error(`   ❌ 거래 저장 실패:`, error.message);
            }
          }
        }

        // Rate limiting - SEC는 초당 10요청 제한
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        console.error(`❌ ${company.ticker} 데이터 수집 실패:`, error.message);
      }
    }

    console.log(`\n✅ 총 ${totalSaved}개의 실제 SEC Form 4 제출 데이터 저장 완료`);

    // 저장된 데이터 확인
    const allTrades = await storage.getInsiderTrades(10);
    console.log(`\n📊 데이터베이스 확인 (총 ${allTrades.length}개):`);
    allTrades.forEach((trade, i) => {
      const filedDate = new Date(trade.filedDate || '');
      const daysOld = Math.floor((Date.now() - filedDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`${i + 1}. ${trade.companyName} (${trade.ticker})`);
      console.log(`   Filed: ${filedDate.toISOString().split('T')[0]} (${daysOld} days ago)`);
      console.log(`   SEC: ${trade.accessionNumber}`);
      console.log(`   URL: ${trade.secFilingUrl}`);
    });

  } catch (error) {
    console.error('❌ 데이터 수집 실패:', error);
    throw error;
  }
}

fetchRealSecData()
  .then(() => {
    console.log('\n✨ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 실패:', error);
    process.exit(1);
  });
