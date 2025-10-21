import axios from 'axios';
import * as cheerio from 'cheerio';
import { storage } from './storage';

/**
 * SEC RSS + Form 4 XML 파싱으로 진짜 내부자 거래 데이터 수집
 * 실제 주식 수, 가격, 거래 타입을 정확히 파싱
 */

interface Form4Data {
  ticker: string;
  companyName: string;
  traderName: string;
  traderTitle: string;
  transactionDate: Date;
  filedDate: Date;
  tradeType: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  accessionNumber: string;
  secFilingUrl: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function parseForm4Xml(url: string): Promise<Form4Data | null> {
  const headers = {
    'User-Agent': 'InsiderTrack contact@insidertrack.com',
    'Accept': 'application/xml, text/xml, */*',
  };

  try {
    // SEC 링크를 XML 파일 링크로 변환
    let xmlUrl = url;
    if (!url.includes('.xml')) {
      // accession number 추출
      const accMatch = url.match(/accession[_-]number=([0-9-]+)/i);
      if (!accMatch) return null;

      const accessionNumber = accMatch[1];
      // 0001234567-25-000123 형식에서 CIK 추출
      const cik = accessionNumber.split('-')[0];
      const accessionForPath = accessionNumber.replace(/-/g, '');

      xmlUrl = `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${cik}&accession_number=${accessionNumber}&xbrl_type=v`;
    }

    console.log(`   📄 Fetching XML from ${xmlUrl.substring(0, 80)}...`);
    const response = await axios.get(xmlUrl, {
      headers,
      timeout: 15000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data, { xmlMode: true });

    // Company info
    const issuerName = $('issuer name').text() || $('issuerName').text();
    const issuerTicker = $('issuer tradingSymbol').text() || $('issuerTradingSymbol').text();

    // Reporter (insider) info
    const reporterName = $('reportingOwner rptOwnerName').text() ||
                         $('rptOwnerName').text() ||
                         $('reporterName').first().text();

    const reporterTitle = $('reportingOwner reportingOwnerRelationship officerTitle').text() ||
                          $('officerTitle').first().text() ||
                          'Officer/Director';

    // Non-derivative transactions (주식 거래)
    const transactions: any[] = [];

    $('nonDerivativeTransaction').each((i, trans) => {
      const $trans = $(trans);

      const transactionDate = $trans.find('transactionDate value').text();
      const transactionCode = $trans.find('transactionCoding transactionCode').text();
      const shares = parseFloat($trans.find('transactionAmounts transactionShares value').text() || '0');
      const pricePerShare = parseFloat($trans.find('transactionAmounts transactionPricePerShare value').text() || '0');
      const acquiredDisposed = $trans.find('transactionAmounts transactionAcquiredDisposedCode value').text();

      if (shares > 0 && pricePerShare > 0) {
        transactions.push({
          transactionDate,
          transactionCode,
          shares,
          pricePerShare,
          acquiredDisposed
        });
      }
    });

    // Derivative transactions도 체크 (옵션 등)
    $('derivativeTransaction').each((i, trans) => {
      const $trans = $(trans);

      const transactionDate = $trans.find('transactionDate value').text();
      const transactionCode = $trans.find('transactionCoding transactionCode').text();
      const shares = parseFloat($trans.find('transactionAmounts transactionShares value').text() || '0');
      const pricePerShare = parseFloat($trans.find('conversionOrExercisePrice value').text() || '0');
      const acquiredDisposed = $trans.find('transactionAmounts transactionAcquiredDisposedCode value').text();

      if (shares > 0) {
        transactions.push({
          transactionDate,
          transactionCode,
          shares,
          pricePerShare: pricePerShare || 0,
          acquiredDisposed
        });
      }
    });

    if (transactions.length === 0) {
      console.log(`   ⚠️  No valid transactions found`);
      return null;
    }

    // 가장 큰 거래 선택
    const mainTransaction = transactions.reduce((max, t) =>
      (t.shares * t.pricePerShare) > (max.shares * max.pricePerShare) ? t : max
    );

    // Transaction code를 사람이 읽을 수 있는 형식으로 변환
    let tradeType = 'OTHER';
    switch (mainTransaction.transactionCode) {
      case 'P':
        tradeType = 'PURCHASE';
        break;
      case 'S':
        tradeType = 'SALE';
        break;
      case 'A':
        tradeType = mainTransaction.acquiredDisposed === 'A' ? 'AWARD' : 'ACQUISITION';
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
    }

    const filedDate = new Date($('periodOfReport').text() || Date.now());
    const transactionDate = new Date(mainTransaction.transactionDate || filedDate);

    // accession number 추출
    const accMatch = url.match(/accession[_-]number=([0-9-]+)/i);
    const accessionNumber = accMatch ? accMatch[1] : `form4-${Date.now()}`;

    return {
      ticker: issuerTicker || 'N/A',
      companyName: issuerName || 'Unknown Company',
      traderName: reporterName || 'Unknown Insider',
      traderTitle: reporterTitle || 'Officer/Director',
      transactionDate,
      filedDate,
      tradeType,
      shares: Math.abs(mainTransaction.shares),
      pricePerShare: mainTransaction.pricePerShare,
      totalValue: Math.abs(mainTransaction.shares * mainTransaction.pricePerShare),
      accessionNumber,
      secFilingUrl: url
    };

  } catch (error: any) {
    console.error(`   ❌ XML parsing error: ${error.message}`);
    return null;
  }
}

async function collectRealForm4Data() {
  console.log('🏛️  SEC Form 4 진짜 데이터 수집 시작...\n');

  const headers = {
    'User-Agent': 'InsiderTrack contact@insidertrack.com',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  };

  try {
    // SEC RSS 피드에서 최신 Form 4 목록 가져오기
    const rssUrl = 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=4&company=&dateb=&owner=include&start=0&count=100&output=atom';

    console.log('📡 SEC RSS 피드에서 Form 4 목록 가져오는 중...');
    const response = await axios.get(rssUrl, {
      headers,
      timeout: 30000
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const entries: { title: string, link: string }[] = [];

    $('entry').each((i, entry) => {
      const title = $(entry).find('title').text();
      const link = $(entry).find('link').attr('href') || '';

      if (title.includes('4 - ') && link) {
        entries.push({ title, link });
      }
    });

    console.log(`📊 총 ${entries.length}개의 Form 4 발견\n`);
    console.log(`🔍 각 Form 4 XML 파싱 중... (시간이 걸릴 수 있습니다)\n`);

    let savedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      try {
        console.log(`\n[${i + 1}/${entries.length}] ${entry.title.substring(0, 60)}...`);

        // XML 파싱으로 실제 데이터 추출
        const form4Data = await parseForm4Xml(entry.link);

        if (!form4Data) {
          skippedCount++;
          console.log(`   ⏭️  Skipped (no valid data)`);
          await delay(1000); // SEC rate limit 준수
          continue;
        }

        // 유효한 데이터만 저장
        if (form4Data.shares === 0 || form4Data.totalValue === 0) {
          skippedCount++;
          console.log(`   ⏭️  Skipped (zero shares/value)`);
          await delay(1000);
          continue;
        }

        await storage.createInsiderTrade({
          ticker: form4Data.ticker,
          companyName: form4Data.companyName,
          traderName: form4Data.traderName,
          traderTitle: form4Data.traderTitle,
          filedDate: form4Data.filedDate,
          tradeType: form4Data.tradeType as any,
          shares: form4Data.shares,
          pricePerShare: form4Data.pricePerShare,
          totalValue: form4Data.totalValue,
          accessionNumber: form4Data.accessionNumber,
          secFilingUrl: form4Data.secFilingUrl,
        });

        savedCount++;
        console.log(`   ✅ ${form4Data.companyName} (${form4Data.ticker})`);
        console.log(`      ${form4Data.tradeType}: ${form4Data.shares.toLocaleString()} shares @ $${form4Data.pricePerShare.toFixed(2)}`);
        console.log(`      Total: $${form4Data.totalValue.toLocaleString()}`);

        // SEC rate limit 준수: 초당 10 요청 제한
        await delay(1000);

      } catch (error: any) {
        if (error?.code === '23505') {
          duplicateCount++;
          console.log(`   ⏭️  Already exists (duplicate)`);
        } else {
          errorCount++;
          console.error(`   ❌ Error: ${error.message}`);
        }
        await delay(1000);
      }
    }

    console.log(`\n\n📊 수집 완료:`);
    console.log(`   ✅ 새로 저장: ${savedCount}개`);
    console.log(`   ⏭️  건너뜀: ${skippedCount}개`);
    console.log(`   🔄 중복: ${duplicateCount}개`);
    console.log(`   ❌ 오류: ${errorCount}개`);

    // 저장된 데이터 확인
    const allTrades = await storage.getInsiderTrades(10);
    console.log(`\n📈 데이터베이스에 저장된 최근 10개:`);
    allTrades.forEach((trade, i) => {
      console.log(`${i + 1}. ${trade.companyName} (${trade.ticker})`);
      console.log(`   ${trade.tradeType}: ${trade.shares.toLocaleString()} shares @ $${trade.pricePerShare.toFixed(2)}`);
      console.log(`   Total: $${trade.totalValue.toLocaleString()}`);
    });

  } catch (error) {
    console.error('❌ 수집 실패:', error);
    throw error;
  }
}

collectRealForm4Data()
  .then(() => {
    console.log('\n✨ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 실패:', error);
    process.exit(1);
  });
