// 실시간 주가 API 서비스
export interface StockPrice {
  symbol: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lastUpdated: string;
}

// Backend API를 통한 주가 조회 (CORS 문제 해결)
async function fetchBackendStockPrice(symbol: string): Promise<StockPrice | null> {
  try {
    const response = await fetch(`/api/stocks/${symbol}`);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.currentPrice === undefined) {
      throw new Error('Invalid backend response');
    }

    return {
      symbol: symbol,
      currentPrice: data.currentPrice,
      priceChange: data.change || 0,
      priceChangePercent: data.changePercent || 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.warn(`Backend API failed for ${symbol}:`, error);
    return null;
  }
}

// Multiple stocks API를 통한 주가 조회 (백업용)
async function fetchMultipleStocksPrice(symbol: string): Promise<StockPrice | null> {
  try {
    const response = await fetch(`/api/stocks?tickers=${symbol}`);

    if (!response.ok) {
      throw new Error(`Multiple stocks API error: ${response.status}`);
    }

    const data = await response.json();
    const stockData = Array.isArray(data) ? data[0] : data;

    if (!stockData || stockData.currentPrice === undefined) {
      throw new Error('Invalid multiple stocks response');
    }

    return {
      symbol: symbol,
      currentPrice: stockData.currentPrice,
      priceChange: stockData.change || 0,
      priceChangePercent: stockData.changePercent || 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.warn(`Multiple stocks API failed for ${symbol}:`, error);
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

  // 여러 API를 순차적으로 시도 (백엔드 API 우선 사용)
  const apiFunctions = [
    fetchBackendStockPrice,
    fetchMultipleStocksPrice
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

// 배치로 여러 심볼의 주가 조회 (백엔드 API 사용)
export async function getMultipleStockPrices(symbols: string[]): Promise<Map<string, StockPrice>> {
  const results = new Map<string, StockPrice>();

  try {
    // 모든 심볼을 한 번에 백엔드로 요청
    const tickersParam = symbols.join(',');
    const response = await fetch(`/api/stocks?tickers=${tickersParam}`);
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }
    
    const data = await response.json();
    const stocksArray = Array.isArray(data) ? data : [data];
    
    stocksArray.forEach((stockData: any) => {
      if (stockData && stockData.ticker && stockData.currentPrice !== undefined) {
        const stockPrice: StockPrice = {
          symbol: stockData.ticker,
          currentPrice: stockData.currentPrice,
          priceChange: stockData.change || 0,
          priceChangePercent: stockData.changePercent || 0,
          lastUpdated: new Date().toISOString()
        };
        
        // 캐시에 저장
        priceCache.set(stockData.ticker, stockPrice);
        results.set(stockData.ticker, stockPrice);
      }
    });
  } catch (error) {
    console.error('Failed to fetch multiple stock prices from backend:', error);
    
    // 백엔드 API가 실패하면 개별 요청으로 폴백
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