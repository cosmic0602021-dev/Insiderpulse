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

export interface TrialActivationResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
  error?: string;
}

export interface TrialStatusResponse {
  isTrialing: boolean;
  canAccessRealtime: boolean;
  trialExpiresAt?: string;
  daysUntilExpiry?: number;
  tier: string;
  status: string;
  hasUsedTrial: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    subscriptionTier: string;
    subscriptionStatus?: string;
    hasUsedTrial?: boolean;
    trialExpiresAt?: Date | null;
  };
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available FIRST
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Merge existing headers from options (won't override Authorization)
    if (options?.headers) {
      const headerObj = options.headers as Record<string, string>;
      Object.entries(headerObj).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'authorization') {
          headers[key] = String(value);
        }
      });
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Get response text first to handle empty responses
      const text = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Failed to parse response as JSON:', text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        // If server returned an error object with message, use it
        const errorMessage = (data as any).message || (data as any).error || response.statusText;
        throw new Error(`API request failed: ${response.status} - ${errorMessage}`);
      }

      return data;
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
    const result = await this.request<TradesResponse>(url, {
      headers: {
        'x-user-id': 'demo-user', // TODO: Get from auth context
      },
    });
    console.log(`[API] Received ${result.trades.length} trades, access level:`, result.accessLevel);
    return result;
  }

  getInsiderTradeById = async (id: string): Promise<InsiderTrade> => {
    return this.request<InsiderTrade>(`/trades/${id}`);
  }

  // Trial system
  activateTrial = async (): Promise<TrialActivationResponse> => {
    console.log('🎯 [API] Activating trial...');
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/trial/activate`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      // Return data regardless of status code (let caller handle success/failure)
      return data;
    } catch (error) {
      console.error('Failed to activate trial:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getTrialStatus = async (): Promise<TrialStatusResponse> => {
    return this.request<TrialStatusResponse>('/trial/status');
  }

  // Health check
  getHealth = async () => {
    return this.request('/health');
  }

  // Authentication
  signup = async (email: string, password: string): Promise<AuthResponse> => {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Save token if login successful
    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  verifyToken = async (): Promise<AuthResponse> => {
    return this.request<AuthResponse>('/auth/verify');
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
  trial: {
    status: ['trial', 'status'] as const,
  },
  health: ['health'] as const,
};