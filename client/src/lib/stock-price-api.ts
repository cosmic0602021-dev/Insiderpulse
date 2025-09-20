// 실시간 주가 API 서비스
export interface StockPrice {
  symbol: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lastUpdated: string;
}

// Yahoo Finance API를 통한 주가 조회 (무료, 높은 신뢰성)
async function fetchYahooFinancePrice(symbol: string): Promise<StockPrice | null> {
  try {
    // CORS 우회를 위한 프록시 서비스 사용
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart.result[0];

    if (!result || !result.meta) {
      throw new Error('Invalid Yahoo Finance response');
    }

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.previousClose;
    const priceChange = currentPrice - previousClose;
    const priceChangePercent = (priceChange / previousClose) * 100;

    return {
      symbol: symbol,
      currentPrice: currentPrice,
      priceChange: priceChange,
      priceChangePercent: priceChangePercent,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.warn(`Yahoo Finance API failed for ${symbol}:`, error);
    return null;
  }
}

// Alpha Vantage API (백업용, API 키 필요)
async function fetchAlphaVantagePrice(symbol: string): Promise<StockPrice | null> {
  try {
    // API 키가 환경변수에 있는 경우에만 사용
    const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      return null;
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    const quote = data['Global Quote'];

    if (!quote || !quote['05. price']) {
      throw new Error('Invalid Alpha Vantage response');
    }

    const currentPrice = parseFloat(quote['05. price']);
    const priceChange = parseFloat(quote['09. change']);
    const priceChangePercent = parseFloat(quote['10. change percent'].replace('%', ''));

    return {
      symbol: symbol,
      currentPrice: currentPrice,
      priceChange: priceChange,
      priceChangePercent: priceChangePercent,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.warn(`Alpha Vantage API failed for ${symbol}:`, error);
    return null;
  }
}

// 주가 데이터 캐시 (메모리 기반, 5분 TTL)
class StockPriceCache {
  private cache = new Map<string, { data: StockPrice; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5분

  get(symbol: string): StockPrice | null {
    const cached = this.cache.get(symbol);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.TTL) {
      this.cache.delete(symbol);
      return null;
    }

    return cached.data;
  }

  set(symbol: string, data: StockPrice): void {
    this.cache.set(symbol, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const priceCache = new StockPriceCache();

// 메인 주가 조회 함수 (여러 API 폴백 지원)
export async function getCurrentStockPrice(symbol: string): Promise<StockPrice | null> {
  if (!symbol) return null;

  // 캐시에서 먼저 확인
  const cachedPrice = priceCache.get(symbol);
  if (cachedPrice) {
    return cachedPrice;
  }

  // 여러 API를 순차적으로 시도
  const apiFunctions = [
    fetchYahooFinancePrice,
    fetchAlphaVantagePrice
  ];

  for (const apiFunction of apiFunctions) {
    try {
      const price = await apiFunction(symbol);
      if (price) {
        // 성공한 데이터를 캐시에 저장
        priceCache.set(symbol, price);
        return price;
      }
    } catch (error) {
      console.warn(`API function failed for ${symbol}:`, error);
      continue;
    }
  }

  console.error(`All stock price APIs failed for symbol: ${symbol}`);
  return null;
}

// 배치로 여러 심볼의 주가 조회
export async function getMultipleStockPrices(symbols: string[]): Promise<Map<string, StockPrice>> {
  const results = new Map<string, StockPrice>();

  // 동시에 너무 많은 요청을 보내지 않도록 배치 처리
  const batchSize = 5;
  const batches: string[][] = [];

  for (let i = 0; i < symbols.length; i += batchSize) {
    batches.push(symbols.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const promises = batch.map(async (symbol) => {
      const price = await getCurrentStockPrice(symbol);
      return { symbol, price };
    });

    const batchResults = await Promise.allSettled(promises);

    batchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.price) {
        results.set(result.value.symbol, result.value.price);
      }
    });

    // API 제한을 고려해 배치 간 대기
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

// 캐시 상태 조회 (디버깅용)
export function getCacheStatus(): { size: number; entries: string[] } {
  return {
    size: priceCache.size(),
    entries: Array.from(priceCache['cache'].keys())
  };
}

// 캐시 클리어
export function clearPriceCache(): void {
  priceCache.clear();
}