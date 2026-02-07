import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertCamp } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCamps() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const campsQuery = useQuery({
    queryKey: [api.camps.list.path],
    queryFn: async () => {
      const res = await fetch(api.camps.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch camps");
      return api.camps.list.responses[200].parse(await res.json());
    }
  });

  const createCampMutation = useMutation({
    mutationFn: async (data: InsertCamp) => {
      const res = await fetch(api.camps.create.path, {
        method: api.camps.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to create camp");
      return api.camps.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.camps.list.path] });
      toast({ title: "Success", description: "Camp added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  return {
    camps: campsQuery.data,
    isLoading: campsQuery.isLoading,
    createCamp: createCampMutation.mutate,
    isCreating: createCampMutation.isPending
  };
}
