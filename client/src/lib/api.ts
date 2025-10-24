import type { TradingStats, InsiderTrade } from '@shared/schema';

const API_BASE_URL = '/api';

export interface AccessLevel {
  hasRealtimeAccess: boolean;
  isDelayed: boolean;
  delayHours: number;
}

export interface TradesResponse {
  trades: InsiderTrade[];
  accessLevel: AccessLevel;
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request to ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Trading statistics
  getTradingStats = async (): Promise<TradingStats> => {
    return this.request<TradingStats>('/stats');
  }

  // Insider trades
  getTrades = async (): Promise<InsiderTrade[]> => {
    return this.getInsiderTrades();
  }

  getInsiderTrades = async (
    limit = 20,
    offset = 0,
    fromDate?: Date,
    toDate?: Date,
    sortBy?: string
  ): Promise<InsiderTrade[]> => {
    const response = await this.getInsiderTradesWithAccess(limit, offset, fromDate, toDate, sortBy);
    return response.trades;
  }

  getInsiderTradesWithAccess = async (
    limit = 20,
    offset = 0,
    fromDate?: Date,
    toDate?: Date,
    sortBy?: string
  ): Promise<TradesResponse> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (fromDate) {
      params.append('from', fromDate.toISOString().split('T')[0]);
    }
    if (toDate) {
      params.append('to', toDate.toISOString().split('T')[0]);
    }
    if (sortBy && (sortBy === 'filedDate' || sortBy === 'createdAt')) {
      params.append('sortBy', sortBy);
    }

    const url = `/trades?${params.toString()}`;
    console.log(`🌐 [API] Requesting: ${url}`);
    const result = await this.request<TradesResponse>(url);
    console.log(`[API] Received ${result.trades.length} trades, access level:`, result.accessLevel);
    return result;
  }

  getInsiderTradeById = async (id: string): Promise<InsiderTrade> => {
    return this.request<InsiderTrade>(`/trades/${id}`);
  }

  // Health check
  getHealth = async () => {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();

// React Query key factory
export const queryKeys = {
  stats: ['stats'] as const,
  trades: {
    all: ['trades'] as const,
    list: (params: { limit?: number; offset?: number; from?: string; to?: string; sortBy?: string }) =>
      ['trades', 'list', params] as const,
    detail: (id: string) => ['trades', 'detail', id] as const,
  },
  tradesList: {
    all: ['trades', 'list'] as const,
    list: (params: { limit?: number; offset?: number; from?: string; to?: string; sortBy?: string }) =>
      ['trades', 'list', params] as const,
    detail: (id: string) => ['trades', 'detail', id] as const,
  },
  health: ['health'] as const,
};