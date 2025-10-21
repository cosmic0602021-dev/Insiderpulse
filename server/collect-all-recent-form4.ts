import axios from 'axios';
import * as cheerio from 'cheerio';
import { storage } from './storage';

/**
 * SEC RSS 피드에서 모든 최신 Form 4 제출을 수집
 * 하드코딩된 회사 목록 없이 SEC에 제출된 모든 insider trading을 가져옴
 */

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

async function collectAllRecentForm4() {
  console.log('🏛️ SEC RSS 피드에서 모든 최신 Form 4 제출 수집 중...\n');

  const headers = {
    'User-Agent': 'InsiderTrack contact@insidertrack.com',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  };

  try {
    // SEC의 최신 제출 RSS 피드
    const rssUrl = 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=4&company=&dateb=&owner=include&start=0&count=100&output=atom';

    console.log('📡 SEC RSS 피드 가져오는 중...');
    const response = await axios.get(rssUrl, {
      headers,
      timeout: 30000
    });

    const $ = cheerio.load(response.data, { xmlMode: true });

    const entries: RssItem[] = [];

    $('entry').each((i, entry) => {
      const title = $(entry).find('title').text();
      const link = $(entry).find('link').attr('href') || '';
      const summary = $(entry).find('summary').text();
      const updated = $(entry).find('updated').text();

      // Form 4만 필터링
      if (title.includes('4 - ')) {
        entries.push({
          title,
          link,
          description: summary,
          pubDate: updated
        });
      }
    });

    console.log(`📊 총 ${entries.length}개의 Form 4 제출 발견\n`);

    let savedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const entry of entries) {
      try {
        // 제목에서 정보 추출
        // 예: "4 - Statement of changes in beneficial ownership of securities (0001234567) (Filer)"
        const titleParts = entry.title.split(' - ');
        const companyInfo = titleParts.length > 1 ? titleParts[1] : entry.title;

        // 링크에서 accession number 추출
        const linkMatch = entry.link.match(/accession[_-]number=([0-9-]+)/i);
        const accessionNumber = linkMatch ? linkMatch[1] : `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // description에서 회사명과 CIK 추출 시도
        let companyName = 'Unknown Company';
        let cik = '';

        const descMatch = entry.description.match(/(.+?)\s*\((\d+)\)/);
        if (descMatch) {
          companyName = descMatch[1].trim();
          cik = descMatch[2];
        } else {
          companyName = companyInfo.replace(/\([^)]*\)/g, '').trim();
        }

        // 날짜 파싱
        const filedDate = new Date(entry.pubDate);

        const trade = {
          ticker: extractTickerFromCompanyName(companyName), // 회사명에서 티커 추정
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

        if (savedCount <= 10) {
          console.log(`✅ ${companyName} - ${filedDate.toISOString().split('T')[0]}`);
        } else if (savedCount % 10 === 0) {
          console.log(`✅ ${savedCount}개 저장됨...`);
        }

      } catch (error: any) {
        if (error?.code === '23505') {
          duplicateCount++;
        } else {
          errorCount++;
          console.error(`❌ 저장 실패:`, error.message);
        }
      }
    }

    console.log(`\n📊 수집 완료:`);
    console.log(`   - 새로 저장: ${savedCount}개`);
    console.log(`   - 중복 건너뜀: ${duplicateCount}개`);
    console.log(`   - 오류: ${errorCount}개`);

    // 데이터베이스 상태 확인
    const allTrades = await storage.getInsiderTrades(100);
    console.log(`\n📈 데이터베이스 총 ${allTrades.length}개 거래 보유`);

    // 최근 10개 샘플
    console.log(`\n📋 최근 10개 거래:`);
    allTrades.slice(0, 10).forEach((trade, i) => {
      const daysOld = Math.floor((Date.now() - new Date(trade.filedDate).getTime()) / (1000 * 60 * 60 * 24));
      console.log(`${i + 1}. ${trade.companyName} - ${daysOld}일 전`);
    });

  } catch (error) {
    console.error('❌ 수집 실패:', error);
    throw error;
  }
}

/**
 * 회사명에서 티커 추정 (간단한 매핑)
 */
function extractTickerFromCompanyName(companyName: string): string {
  const name = companyName.toLowerCase();

  // 주요 회사 매핑
  const tickerMap: { [key: string]: string } = {
    'apple': 'AAPL',
    'microsoft': 'MSFT',
    'nvidia': 'NVDA',
    'tesla': 'TSLA',
    'amazon': 'AMZN',
    'meta': 'META',
    'alphabet': 'GOOGL',
    'google': 'GOOGL',
    'amd': 'AMD',
    'netflix': 'NFLX',
    'intel': 'INTC',
  };

  for (const [key, ticker] of Object.entries(tickerMap)) {
    if (name.includes(key)) {
      return ticker;
    }
  }

  // 회사명의 약어 추정 (첫 4글자)
  const words = companyName.split(' ').filter(w => w.length > 2);
  if (words.length > 0) {
    return words[0].substring(0, 4).toUpperCase();
  }

  return 'N/A';
}

collectAllRecentForm4()
  .then(() => {
    console.log('\n✨ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 실패:', error);
    process.exit(1);
  });
