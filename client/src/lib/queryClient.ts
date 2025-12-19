import { QueryClient, QueryFunction } from "@tanstack/react-query";

const PRODUCTION_API_URL = 'https://insiderpulse.pro';

// localhost 여부 확인 (credentials 결정용)
function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

// 항상 프로덕션 URL로 변환 (환경 감지 실패 문제 해결)
export function resolveApiUrl(url: string): string {
  // 브라우저가 아닌 환경에서는 그대로 반환
  if (typeof window === 'undefined') {
    return url;
  }

  // localhost에서는 그대로 반환 (개발 환경)
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return url;
  }

  // /api로 시작하는 URL은 프로덕션 URL로 변환
  if (url.startsWith('/api')) {
    const absoluteUrl = `${PRODUCTION_API_URL}${url}`;
    console.log(`🔗 [QueryClient] URL resolved: ${url} -> ${absoluteUrl}`);
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
    credentials: isLocalhost() ? "include" : "omit",
    mode: 'cors',
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
      credentials: isLocalhost() ? "include" : "omit",
      mode: 'cors',
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
