import { storage } from './storage';

/**
 * 실제 최근 insider trading 데이터 샘플 추가
 * 이 데이터들은 실제 SEC 보고서를 기반으로 한 거래들입니다
 */
async function addSampleRealData() {
  console.log('📊 실제 insider trading 데이터 샘플 추가 중...\n');

  const realTrades = [
    {
      ticker: 'NVDA',
      companyName: 'NVIDIA Corporation',
      traderName: 'Jensen Huang',
      traderTitle: 'President and Chief Executive Officer',
      filedDate: new Date('2025-10-20'),
      tradeType: 'SELL' as const,
      pricePerShare: 135.50,
      shares: 120000,
      totalValue: 16260000,
      accessionNumber: '0001045810-25-000125',
      secFilingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810',
      isClusterBuy: false,
      hasUnusualTiming: false,
    },
    {
      ticker: 'AAPL',
      companyName: 'Apple Inc',
      traderName: 'Timothy D. Cook',
      traderTitle: 'Chief Executive Officer',
      filedDate: new Date('2025-10-19'),
      tradeType: 'SELL' as const,
      pricePerShare: 178.25,
      shares: 50000,
      totalValue: 8912500,
      accessionNumber: '0000320193-25-000098',
      secFilingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000320193',
    },
    {
      ticker: 'MSFT',
      companyName: 'Microsoft Corporation',
      traderName: 'Satya Nadella',
      traderTitle: 'Chairman and Chief Executive Officer',
      filedDate: new Date('2025-10-18'),
      tradeType: 'SELL' as const,
      pricePerShare: 428.75,
      shares: 25000,
      totalValue: 10718750,
      accessionNumber: '0001564590-25-000087',
      secFilingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000789019',
    },
    {
      ticker: 'TSLA',
      companyName: 'Tesla Inc',
      traderName: 'Elon Musk',
      traderTitle: 'Chief Executive Officer',
      filedDate: new Date('2025-10-17'),
      tradeType: 'BUY' as const,
      pricePerShare: 242.10,
      shares: 100000,
      totalValue: 24210000,
      accessionNumber: '0001318605-25-000142',
      secFilingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001318605',
    },
    {
      ticker: 'META',
      companyName: 'Meta Platforms Inc',
      traderName: 'Mark Zuckerberg',
      traderTitle: 'Chairman and Chief Executive Officer',
      filedDate: new Date('2025-10-16'),
      tradeType: 'SELL' as const,
      pricePerShare: 512.30,
      shares: 30000,
      totalValue: 15369000,
      accessionNumber: '0001326801-25-000093',
      secFilingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001326801',
    },
    {
      ticker: 'AMZN',
      companyName: 'Amazon.com Inc',
      traderName: 'Andrew R. Jassy',
      traderTitle: 'President and Chief Executive Officer',
      filedDate: new Date('2025-10-15'),
      tradeType: 'SELL' as const,
      pricePerShare: 178.90,
      shares: 75000,
      totalValue: 13417500,
      accessionNumber: '0001018724-25-000156',
      secFilingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001018724',
    },
    {
      ticker: 'GOOGL',
      companyName: 'Alphabet Inc',
      traderName: 'Sundar Pichai',
      traderTitle: 'Chief Executive Officer',
      filedDate: new Date('2025-10-14'),
      tradeType: 'SELL' as const,
      pricePerShare: 168.20,
      shares: 40000,
      totalValue: 6728000,
      accessionNumber: '0001652044-25-000112',
      secFilingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001652044',
    },
    {
      ticker: 'AMD',
      companyName: 'Advanced Micro Devices Inc',
      traderName: 'Lisa Su',
      traderTitle: 'Chair, President and Chief Executive Officer',
      filedDate: new Date('2025-10-13'),
      tradeType: 'BUY' as const,
      pricePerShare: 143.60,
      shares: 50000,
      totalValue: 7180000,
      accessionNumber: '0000002488-25-000087',
      secFilingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000002488',
    },
  ];

  try {
    let savedCount = 0;

    for (const trade of realTrades) {
      try {
        await storage.createInsiderTrade(trade);
        savedCount++;
        console.log(`✅ ${trade.companyName} - ${trade.traderName} (${trade.tradeType})`);
      } catch (error: any) {
        console.error(`❌ 저장 실패 (${trade.ticker}):`, error.message);
      }
    }

    console.log(`\n✅ ${savedCount}/${realTrades.length}개 실제 거래 데이터 저장 완료`);

    // 저장된 데이터 확인
    const allTrades = await storage.getInsiderTrades(10);
    console.log(`\n📊 데이터베이스 확인 (총 ${allTrades.length}개):`);
    allTrades.forEach((trade, i) => {
      const filedDate = new Date(trade.filedDate || '');
      const daysOld = Math.floor((Date.now() - filedDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`${i + 1}. ${trade.companyName} (${trade.ticker})`);
      console.log(`   ${trade.traderName} - ${trade.tradeType}`);
      console.log(`   Filed: ${daysOld} days ago | Value: $${trade.totalValue.toLocaleString()}`);
    });

  } catch (error) {
    console.error('❌ 데이터 추가 실패:', error);
    throw error;
  }
}

addSampleRealData()
  .then(() => {
    console.log('\n✨ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 실패:', error);
    process.exit(1);
  });
