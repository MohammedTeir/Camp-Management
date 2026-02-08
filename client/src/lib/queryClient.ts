import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAccessToken, setAccessToken, getRefreshToken, redirectToLogin, removeAccessToken, removeRefreshToken } from "./auth-utils";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Function to refresh JWT tokens
async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const res = await fetch('/api/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      setAccessToken(data.accessToken);
      // Optionally update refresh token too
      // setRefreshToken(data.refreshToken); // Keeping the existing comment for now
      return true;
    } else {
      // If refresh fails, remove tokens and redirect to login
      removeAccessToken();
      removeRefreshToken();
      return false;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    removeAccessToken();
    removeRefreshToken();
    return false;
  }
}

interface FetcherOptions {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  url: string;
  isRetry?: boolean;
}

// Unified authenticated fetcher function
async function authenticatedFetcher({ method = 'GET', headers, body, url, isRetry = false }: FetcherOptions): Promise<Response> {
  let token = getAccessToken();
  const authHeaders: HeadersInit = { ...headers };

  if (token) {
    authHeaders.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(url, {
    method,
    headers: authHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      // Retry the original request with the new token
      return authenticatedFetcher({ method, headers, body, url, isRetry: true });
    }
  }

  // If still unauthorized after refresh attempt, or if it was a retry and still 401
  if (res.status === 401) {
    redirectToLogin();
    throw new Error('Unauthorized');
  }

  await throwIfResNotOk(res);
  return res;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  return authenticatedFetcher({ method, url, body: data, headers: { "Content-Type": "application/json" } });
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/"); // Assuming queryKey[0] is the base URL
    const res = await authenticatedFetcher({ url, method: 'GET' });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // throwIfResNotOk is already called inside authenticatedFetcher
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        // Here, we use a simple fetch for the `me` endpoint in `useAuth` which handles its own 401.
        // For all other queries, we use the authenticatedFetcher.
        // This is a pragmatic approach to avoid circular dependencies or complex setup for `me` endpoint.
        const url = queryKey.join("/");
        const res = await authenticatedFetcher({ url, method: 'GET' });
        await throwIfResNotOk(res); // authenticatedFetcher already throws for 401, so this catches other !res.ok
        return await res.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

