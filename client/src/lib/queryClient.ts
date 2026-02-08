import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAccessToken, setAccessToken, getRefreshToken, redirectToLogin } from "./auth-utils";

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
      // setRefreshToken(data.refreshToken);
      return true;
    } else {
      // If refresh fails, remove tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return false;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return false;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let token = getAccessToken();
  
  const headers: HeadersInit = {
    ...(data ? { "Content-Type": "application/json" } : {}),
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    // Removed credentials: "include" since we're using JWT
  });

  // If we get a 401, try to refresh the token and retry the request
  if (res.status === 401) {
    const refreshed = await refreshTokens();
    
    if (refreshed) {
      // Retry the request with the new token
      const newToken = getAccessToken();
      const retryHeaders: HeadersInit = {
        ...(data ? { "Content-Type": "application/json" } : {}),
      };
      
      if (newToken) {
        retryHeaders.Authorization = `Bearer ${newToken}`;
      }

      res = await fetch(url, {
        method,
        headers: retryHeaders,
        body: data ? JSON.stringify(data) : undefined,
      });
    }
  }

  // If still unauthorized after refresh attempt, redirect to login
  if (res.status === 401) {
    redirectToLogin();
    throw new Error('Unauthorized');
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let token = getAccessToken();
    
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let res = await fetch(queryKey.join("/") as string, {
      headers,
    });

    // If we get a 401, try to refresh the token and retry the request
    if (res.status === 401) {
      const refreshed = await refreshTokens();
      
      if (refreshed) {
        // Retry the request with the new token
        const newToken = getAccessToken();
        const retryHeaders: HeadersInit = {};
        
        if (newToken) {
          retryHeaders.Authorization = `Bearer ${newToken}`;
        }

        res = await fetch(queryKey.join("/") as string, {
          headers: retryHeaders,
        });
      }
    }

    // If still unauthorized after refresh attempt, redirect to login
    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      } else {
        redirectToLogin();
        throw new Error('Unauthorized');
      }
    }

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
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
