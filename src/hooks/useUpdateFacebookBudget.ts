import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateBudgetParams {
    entityId: string;
    entityType: "campaign" | "adset";
    newBudget: number; // in cents
    entityName: string;
}

export function useUpdateFacebookBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ entityId, entityType, newBudget }: UpdateBudgetParams) => {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.access_token) {
                throw new Error("Não autenticado");
            }

            const response = await supabase.functions.invoke("update-facebook-budget", {
                body: { entityId, entityType, newBudget },
            });

            if (response.error) {
                throw new Error(response.error.message || `Erro ao chamar a edge function`);
            }

            if (!response.data.success) {
                throw new Error(response.data.error || "Erro ao atualizar orçamento");
            }

            return response.data;
        },
        onSuccess: (_, variables) => {
            toast.success(
                `Orçamento de ${variables.entityName} atualizado para R$ ${(variables.newBudget / 100).toFixed(2)}.`
            );
            // Refetch relevant queries
            queryClient.invalidateQueries({ queryKey: ["facebook-ads-hierarchical-reports"] });
            queryClient.invalidateQueries({ queryKey: ["facebook-campaigns"] });
            queryClient.invalidateQueries({ queryKey: ["facebook-adsets"] });
        },
        onError: (error) => {
            console.error("Erro ao atualizar orçamento:", error);
            toast.error(`Falha ao atualizar orçamento: ${(error as Error).message}`);
        },
    });
}
