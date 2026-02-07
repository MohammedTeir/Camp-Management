import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertPregnantWoman } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function usePregnantWomen() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const womenQuery = useQuery({
    queryKey: [api.pregnantWomen.list.path],
    queryFn: async () => {
      const res = await fetch(api.pregnantWomen.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch records");
      return api.pregnantWomen.list.responses[200].parse(await res.json());
    }
  });

  const createWomanMutation = useMutation({
    mutationFn: async (data: InsertPregnantWoman) => {
      const res = await fetch(api.pregnantWomen.create.path, {
        method: api.pregnantWomen.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
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
      toast({ title: "Success", description: "Record created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateWomanMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertPregnantWoman>) => {
      const url = buildUrl(api.pregnantWomen.update.path, { id });
      const res = await fetch(url, {
        method: api.pregnantWomen.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update record");
      return api.pregnantWomen.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pregnantWomen.list.path] });
      toast({ title: "Success", description: "Record updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteWomanMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.pregnantWomen.delete.path, { id });
      const res = await fetch(url, { 
        method: api.pregnantWomen.delete.method,
        credentials: "include" 
      });
      
      if (!res.ok) throw new Error("Failed to delete record");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pregnantWomen.list.path] });
      toast({ title: "Success", description: "Record deleted" });
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
      const params = new URLSearchParams({ spouseId });
      const res = await fetch(`${api.pregnantWomen.lookup.path}?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to lookup records");
      return api.pregnantWomen.lookup.responses[200].parse(await res.json());
    },
    enabled: spouseId.length > 0
  });
}
