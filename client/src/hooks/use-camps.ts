import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertCamp } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { getAccessToken } from "@/lib/auth-utils";

export function useCamps() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const campsQuery = useQuery({
    queryKey: [api.camps.list.path],
    queryFn: async () => {
      const token = getAccessToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(api.camps.list.path, { headers });
      if (!res.ok) throw new Error("Failed to fetch camps");
      return api.camps.list.responses[200].parse(await res.json());
    }
  });

  const createCampMutation = useMutation({
    mutationFn: async (data: InsertCamp) => {
      const token = getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(api.camps.create.path, {
        method: api.camps.create.method,
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create camp");
      }
      return api.camps.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.camps.list.path] });
      toast({ title: "تم بنجاح", description: "تم إضافة المخيم بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    }
  });

  const updateCampMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCamp> }) => {
      const token = getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(api.camps.update.path.replace(':id', id.toString()), {
        method: api.camps.update.method,
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update camp");
      }
      return api.camps.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.camps.list.path] });
      toast({ title: "تم بنجاح", description: "تم تحديث المخيم بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    }
  });

  const deleteCampMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = getAccessToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(api.camps.delete.path.replace(':id', id.toString()), {
        method: api.camps.delete.method,
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete camp");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.camps.list.path] });
      toast({ title: "تم بنجاح", description: "تم حذف المخيم بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    }
  });

  return {
    camps: campsQuery.data,
    isLoading: campsQuery.isLoading,
    createCamp: createCampMutation.mutate,
    isCreating: createCampMutation.isPending,
    updateCamp: updateCampMutation.mutate,
    isUpdating: updateCampMutation.isPending,
    deleteCamp: deleteCampMutation.mutate,
    isDeleting: deleteCampMutation.isPending
  };
}
