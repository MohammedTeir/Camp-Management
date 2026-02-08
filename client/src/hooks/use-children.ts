import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertChild, type ChildResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { getAccessToken } from "@/lib/auth-utils";

export function useChildren() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const childrenQuery = useQuery({
    queryKey: [api.children.list.path],
    queryFn: async () => {
      const token = getAccessToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(api.children.list.path, { headers });
      if (!res.ok) throw new Error("Failed to fetch children");
      return api.children.list.responses[200].parse(await res.json());
    }
  });

  const createChildMutation = useMutation({
    mutationFn: async (data: InsertChild) => {
      const token = getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(api.children.create.path, {
        method: api.children.create.method,
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.children.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create child record");
      }
      return api.children.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.children.list.path] });
      toast({ title: "تم بنجاح", description: "تم تسجيل الطفل بنجاح" });
    },
    onError: (error) => {
      toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    }
  });

  const updateChildMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertChild>) => {
      const token = getAccessToken();
      const url = buildUrl(api.children.update.path, { id });
      const headers: HeadersInit = { "Content-Type": "application/json" };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(url, {
        method: api.children.update.method,
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update child record");
      return api.children.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.children.list.path] });
      toast({ title: "تم بنجاح", description: "تم تحديث سجل الطفل بنجاح" });
    },
    onError: (error) => {
      toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    }
  });

  const deleteChildMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = getAccessToken();
      const url = buildUrl(api.children.delete.path, { id });
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(url, {
        method: api.children.delete.method,
        headers
      });

      if (!res.ok) throw new Error("Failed to delete child record");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.children.list.path] });
      toast({ title: "تم بنجاح", description: "تم حذف سجل الطفل" });
    }
  });

  return {
    children: childrenQuery.data,
    isLoading: childrenQuery.isLoading,
    isError: childrenQuery.isError,
    createChild: createChildMutation.mutate,
    isCreating: createChildMutation.isPending,
    updateChild: updateChildMutation.mutate,
    isUpdating: updateChildMutation.isPending,
    deleteChild: deleteChildMutation.mutate,
    isDeleting: deleteChildMutation.isPending
  };
}

export function useChildLookup(parentId: string) {
  return useQuery({
    queryKey: [api.children.lookup.path, parentId],
    queryFn: async () => {
      if (!parentId) return [];
      const token = getAccessToken();
      const params = new URLSearchParams({ parentId });
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(`${api.children.lookup.path}?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to lookup children");
      return api.children.lookup.responses[200].parse(await res.json());
    },
    enabled: parentId.length > 0
  });
}
