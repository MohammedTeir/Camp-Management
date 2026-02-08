import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertPregnantWoman } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { getAccessToken } from "@/lib/auth-utils";

export function usePregnantWomen() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const womenQuery = useQuery({
    queryKey: [api.pregnantWomen.list.path],
    queryFn: async () => {
      const token = getAccessToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(api.pregnantWomen.list.path, { headers });
      if (!res.ok) throw new Error("Failed to fetch records");
      return api.pregnantWomen.list.responses[200].parse(await res.json());
    }
  });

  const createWomanMutation = useMutation({
    mutationFn: async (data: InsertPregnantWoman) => {
      const token = getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(api.pregnantWomen.create.path, {
        method: api.pregnantWomen.create.method,
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.pregnantWomen.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create record");
      }
      return api.pregnantWomen.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pregnantWomen.list.path] });
      toast({ title: "تم بنجاح", description: "تم تسجيل المرأة الحامل بنجاح" });
    },
    onError: (error) => {
      toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    }
  });

  const updateWomanMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertPregnantWoman>) => {
      const token = getAccessToken();
      const url = buildUrl(api.pregnantWomen.update.path, { id });
      const headers: HeadersInit = { "Content-Type": "application/json" };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(url, {
        method: api.pregnantWomen.update.method,
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update record");
      return api.pregnantWomen.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pregnantWomen.list.path] });
      toast({ title: "تم بنجاح", description: "تم تحديث سجل المرأة الحامل بنجاح" });
    },
    onError: (error) => {
      toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    }
  });

  const deleteWomanMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = getAccessToken();
      const url = buildUrl(api.pregnantWomen.delete.path, { id });
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(url, {
        method: api.pregnantWomen.delete.method,
        headers
      });

      if (!res.ok) throw new Error("Failed to delete record");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pregnantWomen.list.path] });
      toast({ title: "تم بنجاح", description: "تم حذف سجل المرأة الحامل" });
    }
  });

  return {
    women: womenQuery.data,
    isLoading: womenQuery.isLoading,
    isError: womenQuery.isError,
    createWoman: createWomanMutation.mutate,
    isCreating: createWomanMutation.isPending,
    updateWoman: updateWomanMutation.mutate,
    isUpdating: updateWomanMutation.isPending,
    deleteWoman: deleteWomanMutation.mutate,
    isDeleting: deleteWomanMutation.isPending
  };
}

export function usePregnantWomanLookup(spouseId: string) {
  return useQuery({
    queryKey: [api.pregnantWomen.lookup.path, spouseId],
    queryFn: async () => {
      if (!spouseId) return [];
      const token = getAccessToken();
      const params = new URLSearchParams({ spouseId });
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(`${api.pregnantWomen.lookup.path}?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to lookup records");
      return api.pregnantWomen.lookup.responses[200].parse(await res.json());
    },
    enabled: spouseId.length > 0
  });
}
