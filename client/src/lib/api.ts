import type { TradingStats, InsiderTrade } from '@shared/schema';
import { ENV_CONFIG } from './environment';

// 빌드 버전: 2024-12-14-v2 (앱인토스 API 호출 수정)
const BUILD_VERSION = '2024-12-14-v2';

// 런타임에 매번 환경 감지 (빌드 시점 고정 방지)
function getApiBaseUrl(): string {
  const url = ENV_CONFIG.apiBaseUrl;
  console.log(`🌐 [API CLIENT v${BUILD_VERSION}] API Base URL:`, url, 'Appintos:', ENV_CONFIG.isAppintos);
  return url;
}

export interface AccessLevel {
  hasRealtimeAccess: boolean;
  isDelayed: boolean;
  delayHours: number;
  isTrialing?: boolean;
  trialExpiresAt?: string;
  hasUsedTrial?: boolean;
  tier?: string;
  status?: string;
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
    if (token) {
      console.log('🔑 [API CLIENT] Token set:', token.substring(0, 20) + '...');
      this.token = token;
    } else {
      console.log('🔓 [API CLIENT] Token cleared');
      this.token = null;
    }
  }
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${getApiBaseUrl()}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available FIRST
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('🔑 [API CLIENT] Adding Authorization header to request:', endpoint);
    } else {
      console.log('⚠️ [API CLIENT] No token available for request:', endpoint);
    }

    // 앱인토스 서명 추가 (있는 경우)
    const appintosSignature = sessionStorage.getItem('appintos_signature');
    if (appintosSignature) {
      headers['X-Appintos-Signature'] = appintosSignature;
      console.log('🔗 [API CLIENT] Adding Appintos signature to request');
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
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          console.log('🔓 Token expired or invalid, clearing session');
          // Clear localStorage and token
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          this.setToken(null);

          // Dispatch custom event to notify auth context
          window.dispatchEvent(new Event('auth:logout'));
        }

        // If server returned an error object with message, use it
        const errorMessage = (data as any).message || (data as any).error || response.statusText;

        // Log technical details for debugging
        console.error(`[API Error] ${response.status} ${endpoint}:`, errorMessage);

        // Throw clean error message for user display (without technical prefix)
        throw new Error(errorMessage);
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
    sortBy?: string,
    transactionTypes?: string[]
  ): Promise<InsiderTrade[]> => {
    const response = await this.getInsiderTradesWithAccess(limit, offset, fromDate, toDate, sortBy, transactionTypes);
    return response.trades;
  }

  getInsiderTradesWithAccess = async (
    limit = 20,
    offset = 0,
    fromDate?: Date,
    toDate?: Date,
    sortBy?: string,
    transactionTypes?: string[]
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
    if (transactionTypes && transactionTypes.length > 0) {
      params.append('transactionTypes', transactionTypes.join(','));
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
  /**
   * @deprecated Use activateTrialWithCard instead
   */
  activateTrial = async (): Promise<TrialActivationResponse> => {
    console.log('🎯 [API] Activating trial...');
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/trial/activate`, {
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

  /**
   * Create a SetupIntent for collecting card information without charging
   */
  createTrialSetupIntent = async (): Promise<{
    success: boolean;
    clientSecret?: string;
    customerId?: string;
    message?: string;
    error?: string;
  }> => {
    console.log('💳 [API] Creating SetupIntent for trial...');
    return this.request('/trial/setup-intent', {
      method: 'POST',
    });
  }

  /**
   * Activate trial with collected payment method
   */
  activateTrialWithCard = async (
    paymentMethodId: string,
    planType: 'monthly' | 'yearly' | 'test'
  ): Promise<{
    success: boolean;
    message: string;
    trialActivatedAt?: string;
    trialExpiresAt?: string;
    subscriptionId?: string;
    error?: string;
  }> => {
    console.log('🎯 [API] Activating trial with card...', { planType });
    return this.request('/trial/activate', {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId, planType }),
    });
  }

  getTrialStatus = async (): Promise<TrialStatusResponse> => {
    // Add timestamp to bypass browser cache
    const timestamp = Date.now();
    return this.request<TrialStatusResponse>(`/trial/status?t=${timestamp}`);
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

  requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    return this.request<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    return this.request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // Rankings API
  getRankings = async (language: string = 'en', limit: number = 10): Promise<any> => {
    const params = new URLSearchParams({
      language,
      limit: limit.toString()
    });

    const url = `/rankings?${params.toString()}`;
    console.log(`🌐 [API] Requesting rankings: ${url}`);

    return this.request(url);
  }
}

export const apiClient = new ApiClient();

// React Query key factory
export const queryKeys = {
  stats: ['stats'] as const,
  trades: {
    all: ['trades'] as const,
    list: (params: { limit?: number; offset?: number; from?: string; to?: string; sortBy?: string; transactionTypes?: string[] }) =>
      ['trades', 'list', params] as const,
    detail: (id: string) => ['trades', 'detail', id] as const,
  },
  tradesList: {
    all: ['trades', 'list'] as const,
    list: (params: { limit?: number; offset?: number; from?: string; to?: string; sortBy?: string; transactionTypes?: string[] }) =>
      ['trades', 'list', params] as const,
    detail: (id: string) => ['trades', 'detail', id] as const,
  },
  rankings: {
    all: ['rankings'] as const,
    list: (params: { language?: string; limit?: number }) =>
      ['rankings', 'list', params] as const,
  },
  trial: {
    status: ['trial', 'status'] as const,
  },
  health: ['health'] as const,
};