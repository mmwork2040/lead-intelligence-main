import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ToggleParams {
  entityId: string;
  entityType: "campaign" | "adset" | "ad";
  newStatus: "ACTIVE" | "PAUSED";
  entityName?: string;
}

export function useToggleFacebookStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityId, entityType, newStatus }: ToggleParams) => {
      const { data, error } = await supabase.functions.invoke("toggle-facebook-status", {
        body: { entityId, entityType, newStatus },
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || "Erro ao alterar status");
      return data;
    },
    onSuccess: (_data, variables) => {
      const label = variables.entityName || variables.entityId;
      const statusLabel = variables.newStatus === "ACTIVE" ? "ativado" : "pausado";
      toast.success(`${label} ${statusLabel} com sucesso!`);

      queryClient.invalidateQueries({ queryKey: ["facebook-ads-hierarchical-reports"] });
      queryClient.invalidateQueries({ queryKey: ["facebook-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["facebook-adsets"] });
      queryClient.invalidateQueries({ queryKey: ["facebook-ads"] });
    },
    onError: (error: Error) => {
      console.error("Toggle status error:", error);
      toast.error("Erro ao alterar status", { description: error.message });
    },
  });
}
