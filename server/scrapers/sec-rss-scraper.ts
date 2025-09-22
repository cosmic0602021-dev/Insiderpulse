/**
 * SEC RSS Feed Scraper - 2순위 (실시간성 최고)
 * SEC의 실시간 RSS 피드를 통해 최신 Form 4 파일링 즉시 감지
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

interface ParsedInsiderTrade {
  ticker: string;
  companyName: string;
  insiderName: string;
  title: string;
  transactionDate: string;
  filingDate: string;
  transactionType: 'BUY' | 'SELL' | 'OPTION_EXERCISE' | 'GIFT' | 'OTHER';
  pricePerShare: number;
  shares: number;
  totalValue: number;
  accessionNumber: string;
  secLink: string;
  source: 'SEC_RSS_FEED';
}

export class SecRssScraper {
  private readonly RSS_URLS = {
    // Form 4 전용 RSS 피드들
    form4Latest: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=4&company=&dateb=&owner=include&start=0&count=100&output=atom',
    form4Today: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=4&company=&dateb=&owner=include&start=0&count=40&output=atom',
    // 추가 RSS 소스들
    allForms: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=&company=&dateb=&owner=include&start=0&count=40&output=atom'
  };

  private headers = {
    'User-Agent': 'InsiderPulse RSS Reader info@insiderpulse.com',
    'Accept': 'application/atom+xml, application/rss+xml, application/xml, text/xml',
    'Accept-Encoding': 'gzip, deflate',
    'Cache-Control': 'no-cache'
  };

  constructor() {
    console.log('📡 SEC RSS Feed Scraper 초기화됨');
  }

  /**
   * 최신 Form 4 파일링들을 RSS에서 가져오기
   */
  async getLatestForm4Filings(): Promise<ParsedInsiderTrade[]> {
    try {
      console.log('🔄 SEC RSS에서 최신 Form 4 파일링 수집 중...');

      const response = await axios.get(this.RSS_URLS.form4Latest, {
        headers: this.headers,
        timeout: 15000
      });

      const feedItems = this.parseRSSFeed(response.data);
      console.log(`📊 RSS에서 ${feedItems.length}개 항목 발견`);

      const trades: ParsedInsiderTrade[] = [];

      // 각 RSS 항목을 Form 4 문서로 파싱
      for (const item of feedItems.slice(0, 50)) { // 최신 50개만 처리
        try {
          const parsedTrades = await this.parseForm4FromRSSItem(item);
          trades.push(...parsedTrades);

          // Rate limiting
          await this.delay(300);

        } catch (error) {
          console.error(`❌ RSS 항목 파싱 실패 (${item.title}):`, error.message);
        }
      }

      console.log(`✅ RSS에서 총 ${trades.length}개 거래 데이터 수집 완료`);
      return trades;

    } catch (error) {
      console.error('❌ SEC RSS 피드 수집 오류:', error.message);
      return [];
    }
  }

  /**
   * RSS 피드 XML 파싱
   */
  private parseRSSFeed(xmlData: string): RSSItem[] {
    try {
      const $ = cheerio.load(xmlData, { xmlMode: true });
      const items: RSSItem[] = [];

      $('entry').each((i, element) => {
        const title = $(element).find('title').text().trim();
        const link = $(element).find('link').attr('href') || '';
        const summary = $(element).find('summary').text().trim();
        const updated = $(element).find('updated').text().trim();
        const id = $(element).find('id').text().trim();

        // Form 4만 필터링
        if (title.includes('4 - ') || title.includes('Form 4')) {
          items.push({
            title,
            link,
            description: summary,
            pubDate: updated,
            guid: id
          });
        }
      });

      return items;

    } catch (error) {
      console.error('❌ RSS XML 파싱 오류:', error.message);
      return [];
    }
  }

  /**
   * RSS 항목에서 Form 4 문서를 가져와서 거래 데이터 추출
   */
  private async parseForm4FromRSSItem(item: RSSItem): Promise<ParsedInsiderTrade[]> {
    try {
      // SEC 링크에서 Form 4 HTML 페이지 가져오기
      const response = await axios.get(item.link, {
        headers: {
          ...this.headers,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const trades: ParsedInsiderTrade[] = [];

      // Form 4에서 기본 정보 추출
      const companyName = this.extractCompanyName($, item.title);
      const ticker = this.extractTicker($, item.title);
      const accessionNumber = this.extractAccessionNumber(item.link);

      // 거래 테이블에서 데이터 추출
      const transactionData = this.extractTransactionData($);

      if (transactionData.length > 0) {
        for (const transaction of transactionData) {
          const trade: ParsedInsiderTrade = {
            ticker: ticker || 'UNKNOWN',
            companyName: companyName || 'Unknown Company',
            insiderName: transaction.insiderName || 'Unknown Insider',
            title: transaction.title || 'Unknown Title',
            transactionDate: transaction.transactionDate || new Date().toISOString().split('T')[0],
            filingDate: this.parseDate(item.pubDate),
            transactionType: this.normalizeTransactionType(transaction.transactionCode),
            pricePerShare: transaction.pricePerShare || 0,
            shares: transaction.shares || 0,
            totalValue: (transaction.pricePerShare || 0) * (transaction.shares || 0),
            accessionNumber: accessionNumber,
            secLink: item.link,
            source: 'SEC_RSS_FEED'
          };

          trades.push(trade);
        }
      }

      return trades;

    } catch (error) {
      console.error(`❌ Form 4 파싱 실패:`, error.message);
      return [];
    }
  }

  /**
   * Form 4 HTML에서 거래 데이터 추출
   */
  private extractTransactionData($: cheerio.CheerioAPI): any[] {
    const transactions: any[] = [];

    try {
      // Form 4의 표준 테이블 구조에서 데이터 추출
      $('table tr').each((i, row) => {
        const cells = $(row).find('td');

        if (cells.length >= 8) {
          const transactionCode = $(cells.eq(3)).text().trim();
          const sharesText = $(cells.eq(4)).text().trim();
          const priceText = $(cells.eq(5)).text().trim();

          // 유효한 거래 데이터인지 확인
          if (transactionCode && (sharesText || priceText)) {
            transactions.push({
              insiderName: $('table').first().find('td').first().text().trim(),
              title: 'Officer', // 실제로는 더 정확한 파싱 필요
              transactionDate: new Date().toISOString().split('T')[0],
              transactionCode: transactionCode,
              shares: this.parseNumber(sharesText),
              pricePerShare: this.parseNumber(priceText)
            });
          }
        }
      });

    } catch (error) {
      console.error('❌ 거래 데이터 추출 오류:', error.message);
    }

    return transactions;
  }

  /**
   * 회사명 추출
   */
  private extractCompanyName($: cheerio.CheerioAPI, title: string): string {
    // Form 4 제목에서 회사명 추출
    const titleMatch = title.match(/4 - (.+?) \(/);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    // HTML에서 회사명 찾기
    const companyElement = $('span').filter((i, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes('company') || text.includes('corp') || text.includes('inc');
    }).first();

    return companyElement.text().trim() || 'Unknown Company';
  }

  /**
   * 티커 추출
   */
  private extractTicker($: cheerio.CheerioAPI, title: string): string {
    // 제목에서 티커 추출 (보통 괄호 안에 있음)
    const tickerMatch = title.match(/\(([A-Z]{1,5})\)/);
    if (tickerMatch) {
      return tickerMatch[1];
    }

    // HTML에서 티커 찾기
    const tickerElement = $('*').filter((i, el) => {
      const text = $(el).text();
      return /\b[A-Z]{1,5}\b/.test(text);
    }).first();

    const tickerText = tickerElement.text().match(/\b[A-Z]{1,5}\b/);
    return tickerText ? tickerText[0] : 'UNKNOWN';
  }

  /**
   * Accession Number 추출
   */
  private extractAccessionNumber(link: string): string {
    const match = link.match(/accession-number=([0-9-]+)/);
    return match ? match[1] : '';
  }

  /**
   * 거래 유형 정규화
   */
  private normalizeTransactionType(code: string): 'BUY' | 'SELL' | 'OPTION_EXERCISE' | 'GIFT' | 'OTHER' {
    const upperCode = code.toUpperCase();

    switch (upperCode) {
      case 'P':
      case 'BUY':
        return 'BUY';
      case 'S':
      case 'SELL':
        return 'SELL';
      case 'M':
      case 'EXERCISE':
        return 'OPTION_EXERCISE';
      case 'G':
      case 'GIFT':
        return 'GIFT';
      default:
        return 'OTHER';
    }
  }

  /**
   * 숫자 파싱
   */
  private parseNumber(text: string): number {
    const cleanText = text.replace(/[,$]/g, '').trim();
    const number = parseFloat(cleanText);
    return isNaN(number) ? 0 : number;
  }

  /**
   * 날짜 파싱
   */
  private parseDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Rate limiting 지연
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 실시간 모니터링 - 새로운 파일링 감지
   */
  async startRealTimeMonitoring(callback: (trades: ParsedInsiderTrade[]) => void): Promise<void> {
    console.log('🚨 SEC RSS 실시간 모니터링 시작...');

    const checkInterval = 5 * 60 * 1000; // 5분마다 체크
    let lastCheckTime = new Date();

    setInterval(async () => {
      try {
        const trades = await this.getLatestForm4Filings();

        // 마지막 체크 이후의 새로운 거래만 필터링
        const newTrades = trades.filter(trade => {
          const filingDate = new Date(trade.filingDate);
          return filingDate > lastCheckTime;
        });

        if (newTrades.length > 0) {
          console.log(`🔔 새로운 거래 ${newTrades.length}건 발견!`);
          callback(newTrades);
        }

        lastCheckTime = new Date();

      } catch (error) {
        console.error('❌ 실시간 모니터링 오류:', error.message);
      }
    }, checkInterval);
  }
}

// Export singleton instance
export const secRssScraper = new SecRssScraper();