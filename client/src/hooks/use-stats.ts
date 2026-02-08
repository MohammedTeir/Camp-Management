import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getAccessToken } from "@/lib/auth-utils";

export function useStats() {
  return useQuery({
    queryKey: [api.stats.dashboard.path],
    queryFn: async () => {
      const token = getAccessToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(api.stats.dashboard.path, { headers });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return api.stats.dashboard.responses[200].parse(await res.json());
    },
    refetchInterval: 30000 // Refresh every 30s
  });
}
