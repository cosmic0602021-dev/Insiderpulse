import axios from 'axios';
import * as cheerio from 'cheerio';
import { storage } from './storage';

/**
 * SEC EDGAR 공식 API를 사용한 진짜 내부자 거래 데이터 수집
 * 100% 무료, 정확한 데이터
 */

interface SECFiling {
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

interface SECFilingsResponse {
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

const SEC_HEADERS = {
  'User-Agent': 'InsiderTrack contact@insidertrack.com',
  'Accept': 'application/json, text/html',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * SEC의 최신 Form 4 제출 목록 가져오기 (RSS 피드)
 */
async function getLatestForm4Filings(limit: number = 100): Promise<any[]> {
  const rssUrl = 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=4&company=&dateb=&owner=include&start=0&count=100&output=atom';

  console.log('📡 SEC RSS 피드에서 Form 4 목록 가져오는 중...');

  const response = await axios.get(rssUrl, {
    headers: SEC_HEADERS,
    timeout: 30000
  });

  const $ = cheerio.load(response.data, { xmlMode: true });
  const filings: any[] = [];

  $('entry').each((i, entry) => {
    if (filings.length >= limit) return false;

    const $entry = $(entry);
    const title = $entry.find('title').text();
    const link = $entry.find('link').attr('href') || '';
    const updated = $entry.find('updated').text();
    const summary = $entry.find('summary').text();

    if (title.includes('4 - ') && link) {
      // Extract accession number from summary or link
      const accMatch = summary.match(/AccNo:\s*(\d{10}-\d{2}-\d{6})/i) ||
                      link.match(/\/(\d{10}-\d{2}-\d{6})/);

      if (accMatch) {
        filings.push({
          title,
          link,
          filingDate: updated,
          accessionNumber: accMatch[1]
        });
      }
    }
  });

  console.log(`✅ ${filings.length}개의 Form 4 제출 발견`);
  return filings;
}

/**
 * Form 4 HTML 페이지에서 실제 데이터 추출
 */
async function parseForm4Filing(filing: any): Promise<any | null> {
  try {
    console.log(`   📄 파싱: ${filing.accessionNumber}`);

    // Form 4의 HTML 페이지 가져오기
    const response = await axios.get(filing.link, {
      headers: SEC_HEADERS,
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    // XML 파일 링크 찾기
    let xmlLink = '';
    $('table.tableFile a').each((i, elem) => {
      const href = $(elem).attr('href') || '';
      const text = $(elem).text().toLowerCase();
      if (href.endsWith('.xml') && !href.includes('index')) {
        xmlLink = 'https://www.sec.gov' + href;
        return false; // break
      }
    });

    if (!xmlLink) {
      console.log('   ⚠️  XML 파일을 찾을 수 없음');
      return null;
    }

    // XML 파일 다운로드 및 파싱
    await delay(100); // Rate limit
    const xmlResponse = await axios.get(xmlLink, {
      headers: SEC_HEADERS,
      timeout: 15000
    });

    const xml$ = cheerio.load(xmlResponse.data, { xmlMode: true });

    // 발행자 (회사) 정보
    const issuerCik = xml$('issuer issuerCik').text();
    const issuerName = xml$('issuer issuerName').text();
    const issuerTicker = xml$('issuer issuerTradingSymbol').text();

    // 보고자 (내부자) 정보
    const reporterCik = xml$('reportingOwner reportingOwnerId reportingOwnerCik').text();
    const reporterName = xml$('reportingOwner reportingOwnerId rptOwnerName').text();

    // 직책 정보
    const isDirector = xml$('reportingOwner reportingOwnerRelationship isDirector').text() === '1';
    const isOfficer = xml$('reportingOwner reportingOwnerRelationship isOfficer').text() === '1';
    const isTenPercentOwner = xml$('reportingOwner reportingOwnerRelationship isTenPercentOwner').text() === '1';
    const officerTitle = xml$('reportingOwner reportingOwnerRelationship officerTitle').text();

    let title = officerTitle || '';
    if (!title) {
      if (isDirector) title = 'Director';
      else if (isTenPercentOwner) title = '10% Owner';
      else if (isOfficer) title = 'Officer';
    }

    // 거래 정보 추출
    const trades: any[] = [];

    // Non-derivative transactions (일반 주식 거래)
    xml$('nonDerivativeTransaction').each((i, trans) => {
      const $trans = xml$(trans);

      const securityTitle = $trans.find('securityTitle value').text();
      const transactionDate = $trans.find('transactionDate value').text();
      const transactionCode = $trans.find('transactionCoding transactionCode').text();
      const sharesText = $trans.find('transactionAmounts transactionShares value').text();
      const priceText = $trans.find('transactionAmounts transactionPricePerShare value').text();
      const acquiredDisposed = $trans.find('transactionAmounts transactionAcquiredDisposedCode value').text();
      const sharesOwnedAfter = $trans.find('postTransactionAmounts sharesOwnedFollowingTransaction value').text();

      const shares = parseFloat(sharesText) || 0;
      const price = parseFloat(priceText) || 0;

      if (shares > 0) {
        trades.push({
          securityTitle,
          transactionDate,
          transactionCode,
          shares,
          pricePerShare: price,
          totalValue: shares * price,
          acquiredDisposed,
          sharesOwnedAfter: parseFloat(sharesOwnedAfter) || 0,
          isDerivative: false
        });
      }
    });

    // Derivative transactions (옵션 등)
    xml$('derivativeTransaction').each((i, trans) => {
      const $trans = xml$(trans);

      const securityTitle = $trans.find('securityTitle value').text();
      const transactionDate = $trans.find('transactionDate value').text();
      const transactionCode = $trans.find('transactionCoding transactionCode').text();
      const sharesText = $trans.find('transactionAmounts transactionShares value').text();
      const priceText = $trans.find('conversionOrExercisePrice value').text();
      const acquiredDisposed = $trans.find('transactionAmounts transactionAcquiredDisposedCode value').text();

      const shares = parseFloat(sharesText) || 0;
      const price = parseFloat(priceText) || 0;

      if (shares > 0) {
        trades.push({
          securityTitle,
          transactionDate,
          transactionCode,
          shares,
          pricePerShare: price,
          totalValue: shares * price,
          acquiredDisposed,
          sharesOwnedAfter: 0,
          isDerivative: true
        });
      }
    });

    if (trades.length === 0) {
      console.log('   ⚠️  거래 정보 없음');
      return null;
    }

    // 가장 큰 거래 선택 (또는 모든 거래 반환)
    const mainTrade = trades.reduce((max, t) =>
      t.totalValue > max.totalValue ? t : max
    );

    // Transaction code를 거래 타입으로 변환
    let tradeType = 'OTHER';
    switch (mainTrade.transactionCode) {
      case 'P': tradeType = 'PURCHASE'; break;
      case 'S': tradeType = 'SALE'; break;
      case 'A': tradeType = mainTrade.acquiredDisposed === 'A' ? 'AWARD' : 'ACQUISITION'; break;
      case 'D': tradeType = 'DISPOSITION'; break;
      case 'G': tradeType = 'GIFT'; break;
      case 'M': tradeType = 'OPTION_EXERCISE'; break;
      case 'F': tradeType = 'TAX_PAYMENT'; break;
      case 'I': tradeType = 'DISCRETIONARY'; break;
      case 'W': tradeType = 'ACQUISITION_DISPOSITION'; break;
    }

    return {
      ticker: issuerTicker || 'N/A',
      companyName: issuerName || 'Unknown Company',
      companyCik: issuerCik,
      traderName: reporterName || 'Unknown Insider',
      traderCik: reporterCik,
      traderTitle: title || 'Insider',
      transactionDate: mainTrade.transactionDate || filing.filingDate,
      filedDate: filing.filingDate,
      tradeType,
      shares: mainTrade.shares,
      pricePerShare: mainTrade.pricePerShare,
      totalValue: mainTrade.totalValue,
      sharesOwnedAfter: mainTrade.sharesOwnedAfter,
      securityTitle: mainTrade.securityTitle,
      isDerivative: mainTrade.isDerivative,
      accessionNumber: filing.accessionNumber,
      secFilingUrl: filing.link,
      allTrades: trades // 모든 거래 정보 저장
    };

  } catch (error: any) {
    console.log(`   ❌ 파싱 실패: ${error.message}`);
    return null;
  }
}

/**
 * 메인 수집 함수
 */
async function collectSECInsiderTrades(limit: number = 50) {
  console.log('🏛️  SEC EDGAR 공식 API로 진짜 내부자 거래 데이터 수집 시작...\n');

  try {
    // 1. 최신 Form 4 제출 목록 가져오기
    const filings = await getLatestForm4Filings(limit);

    if (filings.length === 0) {
      console.log('❌ Form 4 제출을 찾을 수 없습니다.');
      return;
    }

    console.log(`\n🔍 ${filings.length}개의 Form 4 파일 파싱 시작...\n`);

    let savedCount = 0;
    let skippedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    // 2. 각 Form 4 파일 파싱
    for (let i = 0; i < filings.length; i++) {
      const filing = filings[i];

      console.log(`\n[${i + 1}/${filings.length}] ${filing.title.substring(0, 70)}...`);

      try {
        const tradeData = await parseForm4Filing(filing);

        if (!tradeData) {
          skippedCount++;
          await delay(200); // SEC rate limit: 10 requests per second
          continue;
        }

        // 유효성 검사
        if (tradeData.shares === 0 || tradeData.totalValue === 0) {
          console.log(`   ⏭️  건너뜀 (0 값)`);
          skippedCount++;
          await delay(200);
          continue;
        }

        // 데이터베이스에 저장
        await storage.createInsiderTrade({
          ticker: tradeData.ticker,
          companyName: tradeData.companyName,
          traderName: tradeData.traderName,
          traderTitle: tradeData.traderTitle,
          filedDate: new Date(tradeData.filedDate),
          tradeType: tradeData.tradeType as any,
          shares: tradeData.shares,
          pricePerShare: tradeData.pricePerShare,
          totalValue: tradeData.totalValue,
          accessionNumber: tradeData.accessionNumber,
          secFilingUrl: tradeData.secFilingUrl,
          isVerified: true,
          verificationStatus: 'VERIFIED',
          verificationNotes: 'SEC EDGAR official data'
        });

        savedCount++;
        console.log(`   ✅ ${tradeData.companyName} (${tradeData.ticker})`);
        console.log(`      ${tradeData.tradeType}: ${tradeData.shares.toLocaleString()} shares @ $${tradeData.pricePerShare.toFixed(2)}`);
        console.log(`      Total: $${tradeData.totalValue.toLocaleString()}`);
        console.log(`      Trader: ${tradeData.traderName} (${tradeData.traderTitle})`);

        await delay(200); // SEC rate limit

      } catch (error: any) {
        if (error?.code === '23505') {
          duplicateCount++;
          console.log(`   ⏭️  이미 존재 (중복)`);
        } else {
          errorCount++;
          console.error(`   ❌ 오류: ${error.message}`);
        }
        await delay(200);
      }
    }

    // 결과 출력
    console.log(`\n\n📊 수집 완료:`);
    console.log(`   ✅ 새로 저장: ${savedCount}개`);
    console.log(`   ⏭️  건너뜀: ${skippedCount}개`);
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
      console.log(`   Filed: ${new Date(trade.filedDate).toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('❌ 수집 실패:', error);
    throw error;
  }
}

// 실행
collectSECInsiderTrades(50)
  .then(() => {
    console.log('\n✨ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 실패:', error);
    process.exit(1);
  });
