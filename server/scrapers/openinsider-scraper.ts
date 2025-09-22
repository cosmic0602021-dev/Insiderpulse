/**
 * OpenInsider.com Scraper - 3순위 (가장 쉽고 신뢰할 수 있음)
 * OpenInsider는 SEC 데이터를 정리해서 제공하는 무료 사이트
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

interface OpenInsiderTrade {
  ticker: string;
  companyName: string;
  insiderName: string;
  title: string;
  tradeType: 'BUY' | 'SELL' | 'OPTION_EXERCISE' | 'GIFT' | 'OTHER';
  price: number;
  shares: number;
  value: number;
  tradeDate: string;
  filingDate: string;
  ownedShares: number;
  deltaOwn: string;
  link: string;
  source: 'OPENINSIDER';
}

export class OpenInsiderScraper {
  private baseURL = 'http://openinsider.com';
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  constructor() {
    console.log('🔍 OpenInsider Scraper 초기화됨');
  }

  /**
   * 최신 내부자 거래 데이터 스크래핑
   */
  async scrapeLatestTrades(maxTrades: number = 100): Promise<OpenInsiderTrade[]> {
    try {
      console.log(`🔄 OpenInsider에서 최신 거래 ${maxTrades}개 수집 중...`);

      const url = `${this.baseURL}/latest-insider-trading`;
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const trades: OpenInsiderTrade[] = [];

      // OpenInsider의 메인 테이블 찾기
      const mainTable = $('table').filter((i, table) => {
        const headers = $(table).find('th');
        return headers.length >= 8 &&
               $(headers).text().includes('Ticker') &&
               $(headers).text().includes('Company');
      }).first();

      if (mainTable.length === 0) {
        console.log('⚠️ OpenInsider 테이블을 찾을 수 없습니다');
        return [];
      }

      console.log('✅ OpenInsider 테이블 발견됨');

      // 테이블 행들 처리
      mainTable.find('tr').slice(1, maxTrades + 1).each((i, row) => {
        try {
          const trade = this.parseTableRow($, row);
          if (trade) {
            trades.push(trade);
          }
        } catch (error) {
          console.error(`❌ 행 파싱 오류 (행 ${i}):`, error.message);
        }
      });

      console.log(`✅ OpenInsider에서 ${trades.length}개 거래 데이터 수집 완료`);
      return trades;

    } catch (error) {
      console.error('❌ OpenInsider 스크래핑 오류:', error.message);
      return [];
    }
  }

  /**
   * 특정 티커의 내부자 거래 스크래핑
   */
  async scrapeByTicker(ticker: string): Promise<OpenInsiderTrade[]> {
    try {
      console.log(`📊 ${ticker} 티커 전용 거래 데이터 수집 중...`);

      const url = `${this.baseURL}/search?stock=${ticker}&insider=&x=0&y=0`;
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const trades: OpenInsiderTrade[] = [];

      // 검색 결과 테이블 찾기
      const resultTable = $('table').filter((i, table) => {
        return $(table).find('th').text().includes('Trade Date');
      }).first();

      if (resultTable.length === 0) {
        console.log(`⚠️ ${ticker}에 대한 거래 데이터를 찾을 수 없습니다`);
        return [];
      }

      resultTable.find('tr').slice(1, 51).each((i, row) => {
        try {
          const trade = this.parseTableRow($, row);
          if (trade && trade.ticker === ticker) {
            trades.push(trade);
          }
        } catch (error) {
          console.error(`❌ ${ticker} 행 파싱 오류:`, error.message);
        }
      });

      console.log(`✅ ${ticker}에서 ${trades.length}개 거래 데이터 수집 완료`);
      return trades;

    } catch (error) {
      console.error(`❌ ${ticker} 스크래핑 오류:`, error.message);
      return [];
    }
  }

  /**
   * 큰 거래들만 필터링 (특정 금액 이상)
   */
  async scrapeLargeTrades(minValue: number = 1000000): Promise<OpenInsiderTrade[]> {
    try {
      console.log(`💰 ${minValue / 1000000}M 달러 이상 대규모 거래 수집 중...`);

      // OpenInsider의 큰 거래 페이지
      const url = `${this.baseURL}/insider-trading-activity/insider-trading-by-sec-filings`;
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const trades = await this.scrapeLatestTrades(200); // 더 많은 데이터 수집

      // 큰 거래들만 필터링
      const largeTrades = trades.filter(trade => trade.value >= minValue);

      console.log(`💎 ${largeTrades.length}개 대규모 거래 발견 (${minValue / 1000000}M+ 달러)`);
      return largeTrades;

    } catch (error) {
      console.error('❌ 대규모 거래 스크래핑 오류:', error.message);
      return [];
    }
  }

  /**
   * 테이블 행을 거래 데이터로 파싱
   */
  private parseTableRow($: cheerio.CheerioAPI, row: any): OpenInsiderTrade | null {
    try {
      const cells = $(row).find('td');

      if (cells.length < 8) {
        return null; // 유효하지 않은 행
      }

      // OpenInsider 표준 테이블 구조에 맞춰 파싱
      const ticker = $(cells.eq(0)).text().trim();
      const companyName = $(cells.eq(1)).text().trim();
      const insiderName = $(cells.eq(2)).text().trim();
      const title = $(cells.eq(3)).text().trim();
      const tradeTypeText = $(cells.eq(4)).text().trim();
      const priceText = $(cells.eq(5)).text().trim();
      const sharesText = $(cells.eq(6)).text().trim();
      const valueText = $(cells.eq(7)).text().trim();

      // 추가 데이터 (더 많은 열이 있다면)
      const tradeDateText = cells.length > 8 ? $(cells.eq(8)).text().trim() : '';
      const ownedText = cells.length > 9 ? $(cells.eq(9)).text().trim() : '';
      const deltaOwnText = cells.length > 10 ? $(cells.eq(10)).text().trim() : '';

      // 링크 추출
      const linkElement = $(cells.eq(0)).find('a').first();
      const link = linkElement.length > 0 ?
        `${this.baseURL}${linkElement.attr('href')}` : '';

      // 필수 데이터 검증
      if (!ticker || !companyName || !insiderName) {
        return null;
      }

      // 거래 데이터 생성
      const trade: OpenInsiderTrade = {
        ticker: ticker,
        companyName: companyName,
        insiderName: insiderName,
        title: title || 'Unknown',
        tradeType: this.normalizeTradeType(tradeTypeText),
        price: this.parsePrice(priceText),
        shares: this.parseShares(sharesText),
        value: this.parseValue(valueText),
        tradeDate: this.parseDate(tradeDateText) || new Date().toISOString().split('T')[0],
        filingDate: new Date().toISOString().split('T')[0], // OpenInsider는 보통 filingDate를 별도로 표시하지 않음
        ownedShares: this.parseShares(ownedText),
        deltaOwn: deltaOwnText,
        link: link,
        source: 'OPENINSIDER'
      };

      return trade;

    } catch (error) {
      console.error('❌ 테이블 행 파싱 오류:', error.message);
      return null;
    }
  }

  /**
   * 거래 유형 정규화
   */
  private normalizeTradeType(tradeText: string): 'BUY' | 'SELL' | 'OPTION_EXERCISE' | 'GIFT' | 'OTHER' {
    const text = tradeText.toLowerCase();

    if (text.includes('buy') || text.includes('purchase') || text.includes('+')) {
      return 'BUY';
    } else if (text.includes('sell') || text.includes('sale') || text.includes('-')) {
      return 'SELL';
    } else if (text.includes('option') || text.includes('exercise')) {
      return 'OPTION_EXERCISE';
    } else if (text.includes('gift')) {
      return 'GIFT';
    } else {
      return 'OTHER';
    }
  }

  /**
   * 가격 파싱
   */
  private parsePrice(priceText: string): number {
    if (!priceText) return 0;

    const cleanText = priceText.replace(/[$,]/g, '').trim();
    const price = parseFloat(cleanText);
    return isNaN(price) ? 0 : price;
  }

  /**
   * 주식 수 파싱
   */
  private parseShares(sharesText: string): number {
    if (!sharesText) return 0;

    const cleanText = sharesText.replace(/[,+]/g, '').trim();
    const shares = parseInt(cleanText);
    return isNaN(shares) ? 0 : shares;
  }

  /**
   * 총 거래 금액 파싱
   */
  private parseValue(valueText: string): number {
    if (!valueText) return 0;

    let cleanText = valueText.replace(/[$,]/g, '').trim();

    // M (million), K (thousand) 처리
    const multiplier = cleanText.includes('M') ? 1000000 :
                      cleanText.includes('K') ? 1000 : 1;

    cleanText = cleanText.replace(/[MK]/g, '');
    const value = parseFloat(cleanText);

    return isNaN(value) ? 0 : value * multiplier;
  }

  /**
   * 날짜 파싱
   */
  private parseDate(dateText: string): string | null {
    if (!dateText) return null;

    try {
      // 다양한 날짜 형식 처리
      const date = new Date(dateText);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  /**
   * 여러 티커들을 동시에 스크래핑
   */
  async scrapeMultipleTickers(tickers: string[]): Promise<OpenInsiderTrade[]> {
    console.log(`📈 ${tickers.length}개 티커 일괄 스크래핑 시작...`);

    const allTrades: OpenInsiderTrade[] = [];

    for (const ticker of tickers) {
      try {
        const trades = await this.scrapeByTicker(ticker);
        allTrades.push(...trades);

        // Rate limiting
        await this.delay(1000);

      } catch (error) {
        console.error(`❌ ${ticker} 스크래핑 실패:`, error.message);
      }
    }

    console.log(`✅ 총 ${allTrades.length}개 거래 데이터 수집 완료`);
    return allTrades;
  }

  /**
   * Rate limiting 지연
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 주요 기업들의 티커 목록
   */
  private readonly MAJOR_TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'INTC',
    'AMD', 'NFLX', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'SNOW', 'PLTR',
    'UBER', 'LYFT', 'SQ', 'SHOP', 'ROKU', 'ZM', 'DOCU', 'TWLO'
  ];

  /**
   * 주요 기업들의 최신 거래 스크래핑
   */
  async scrapeMajorCompanies(): Promise<OpenInsiderTrade[]> {
    return await this.scrapeMultipleTickers(this.MAJOR_TICKERS);
  }
}

// Export singleton instance
export const openInsiderScraper = new OpenInsiderScraper();