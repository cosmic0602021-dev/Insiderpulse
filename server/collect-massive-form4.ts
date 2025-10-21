import axios from 'axios';
import * as cheerio from 'cheerio';
import { storage } from './storage';

/**
 * SEC에서 대량의 Form 4 제출을 수집 (페이지네이션)
 */

async function collectMassiveForm4(totalToCollect: number = 500) {
  console.log(`🏛️ SEC에서 최대 ${totalToCollect}개의 Form 4 제출 수집 중...\n`);

  const headers = {
    'User-Agent': 'InsiderTrack contact@insidertrack.com',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  };

  let savedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  let page = 0;
  const itemsPerPage = 100;

  try {
    while (savedCount < totalToCollect && page < 10) { // 최대 10 페이지 (1000개)
      const startIndex = page * itemsPerPage;
      const rssUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=4&company=&dateb=&owner=include&start=${startIndex}&count=${itemsPerPage}&output=atom`;

      console.log(`\n📄 페이지 ${page + 1} (항목 ${startIndex}-${startIndex + itemsPerPage}) 수집 중...`);

      try {
        const response = await axios.get(rssUrl, {
          headers,
          timeout: 30000
        });

        const $ = cheerio.load(response.data, { xmlMode: true });

        const entries: any[] = [];

        $('entry').each((i, entry) => {
          const title = $(entry).find('title').text();
          const link = $(entry).find('link').attr('href') || '';
          const summary = $(entry).find('summary').text();
          const updated = $(entry).find('updated').text();

          if (title.includes('4 - ')) {
            entries.push({ title, link, description: summary, pubDate: updated });
          }
        });

        console.log(`   📊 ${entries.length}개 Form 4 발견`);

        if (entries.length === 0) {
          console.log('   ⚠️ 더 이상 데이터 없음, 수집 종료');
          break;
        }

        for (const entry of entries) {
          if (savedCount >= totalToCollect) break;

          try {
            const titleParts = entry.title.split(' - ');
            const companyInfo = titleParts.length > 1 ? titleParts[1] : entry.title;

            const linkMatch = entry.link.match(/accession[_-]number=([0-9-]+)/i);
            const accessionNumber = linkMatch ? linkMatch[1] : `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            let companyName = 'Unknown Company';
            const descMatch = entry.description.match(/(.+?)\s*\((\d+)\)/);
            if (descMatch) {
              companyName = descMatch[1].trim();
            } else {
              companyName = companyInfo.replace(/\([^)]*\)/g, '').trim();
            }

            const filedDate = new Date(entry.pubDate);

            const trade = {
              ticker: extractTickerFromCompanyName(companyName),
              companyName: companyName,
              traderName: 'Insider',
              traderTitle: 'Officer/Director',
              filedDate: filedDate,
              tradeType: 'OTHER' as const,
              pricePerShare: 0,
              shares: 0,
              totalValue: 0,
              accessionNumber: accessionNumber,
              secFilingUrl: entry.link,
            };

            await storage.createInsiderTrade(trade);
            savedCount++;

            if (savedCount % 50 === 0) {
              console.log(`   ✅ ${savedCount}개 저장됨...`);
            }

          } catch (error: any) {
            if (error?.code === '23505') {
              duplicateCount++;
            } else {
              errorCount++;
            }
          }
        }

        page++;

        // Rate limiting - SEC 요청 제한 준수
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`   ❌ 페이지 ${page + 1} 수집 실패:`, error.message);
        break;
      }
    }

    console.log(`\n✅ 수집 완료:`);
    console.log(`   - 새로 저장: ${savedCount}개`);
    console.log(`   - 중복 건너뜀: ${duplicateCount}개`);
    console.log(`   - 오류: ${errorCount}개`);

    // 데이터베이스 상태
    const allTrades = await storage.getInsiderTrades(20);
    console.log(`\n📈 데이터베이스 최근 20개 거래:`);
    allTrades.forEach((trade, i) => {
      const daysOld = Math.floor((Date.now() - new Date(trade.filedDate).getTime()) / (1000 * 60 * 60 * 24));
      console.log(`${i + 1}. ${trade.companyName} - ${daysOld}일 전 - ${trade.accessionNumber?.substring(0, 20)}`);
    });

  } catch (error) {
    console.error('❌ 수집 실패:', error);
    throw error;
  }
}

function extractTickerFromCompanyName(companyName: string): string {
  const name = companyName.toLowerCase();
  const tickerMap: { [key: string]: string } = {
    'apple': 'AAPL', 'microsoft': 'MSFT', 'nvidia': 'NVDA', 'tesla': 'TSLA',
    'amazon': 'AMZN', 'meta': 'META', 'alphabet': 'GOOGL', 'google': 'GOOGL',
    'amd': 'AMD', 'netflix': 'NFLX', 'intel': 'INTC',
  };

  for (const [key, ticker] of Object.entries(tickerMap)) {
    if (name.includes(key)) return ticker;
  }

  const words = companyName.split(' ').filter(w => w.length > 2);
  return words.length > 0 ? words[0].substring(0, 4).toUpperCase() : 'N/A';
}

// 커맨드라인 인자로 수집할 개수 지정 가능
const targetCount = process.argv[2] ? parseInt(process.argv[2]) : 500;

collectMassiveForm4(targetCount)
  .then(() => {
    console.log('\n✨ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 실패:', error);
    process.exit(1);
  });
