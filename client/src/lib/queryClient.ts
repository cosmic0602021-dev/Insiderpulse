import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { ENV_CONFIG } from './environment';

// 앱인토스 환경에서 API URL 변환 (다른 파일에서도 사용 가능)
export function resolveApiUrl(url: string): string {
  // URL이 /api/로 시작하고 앱인토스 환경이면 절대 URL로 변환
  if (url.startsWith('/api') && ENV_CONFIG.isAppintos) {
    const absoluteUrl = `https://insiderpulse.pro${url}`;
    console.log(`🔗 [QueryClient] Appintos URL resolved: ${url} -> ${absoluteUrl}`);
    return absoluteUrl;
  }
  return url;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};

  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 앱인토스 환경에서 URL 변환
  const resolvedUrl = resolveApiUrl(url);

  const res = await fetch(resolvedUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: ENV_CONFIG.isAppintos ? "omit" : "include",
    mode: 'cors',  // 명시적 CORS 모드
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // 앱인토스 환경에서 URL 변환
    const url = resolveApiUrl(queryKey.join("/") as string);

    const res = await fetch(url, {
      credentials: ENV_CONFIG.isAppintos ? "omit" : "include",
      mode: 'cors',  // 명시적 CORS 모드
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,      // Refetch when window regains focus
      refetchOnMount: 'always',        // Always refetch on component mount
      staleTime: 5 * 60 * 1000,        // Data becomes stale after 5 minutes
      gcTime: 10 * 60 * 1000,          // Garbage collect after 10 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
