import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentUserId } from "@/lib/getCurrentUserId";

export interface CampaignGoal {
  id: string;
  metric_type: "leads" | "sales" | "revenue";
  target_value: number;
  current_value: number;
  product_slug: string | null;
  campaign_id: string;
  start_date: string;
  end_date: string;
}

export const useCampaignGoals = (campaignId: string) => {
  return useQuery({
    queryKey: ["campaign-goals", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate current values based on actual data
      const goalsWithProgress = await Promise.all(
        (data || []).map(async (goal: any) => {
          const currentValue = await calculateCurrentValue(
            goal.metric_type,
            goal.start_date,
            goal.end_date,
            campaignId,
            goal.product_slug
          );

          return {
            ...goal,
            current_value: currentValue,
          };
        })
      );

      return goalsWithProgress as CampaignGoal[];
    },
    enabled: !!campaignId,
  });
};

async function calculateCurrentValue(
  metricType: string,
  startDate: string,
  endDate: string,
  campaignId: string,
  productSlug: string | null
): Promise<number> {
  try {
    // Get campaign slug
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("slug")
      .eq("id", campaignId)
      .single();

    if (!campaign) return 0;

    if (metricType === "leads") {
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("project_slug", campaign.slug)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      return count || 0;
    }

    if (metricType === "sales") {
      let query = supabase
        .from("purchases")
        .select("*, leads!inner(*)", { count: "exact", head: true })
        .eq("status", "approved")
        .eq("leads.project_slug", campaign.slug)
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate);

      if (productSlug) {
        query = query.eq("product_slug", productSlug);
      }

      const { count } = await query;
      return count || 0;
    }

    if (metricType === "revenue") {
      let query = supabase
        .from("purchases")
        .select("value, leads!inner(*)")
        .eq("status", "approved")
        .eq("leads.project_slug", campaign.slug)
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate);

      if (productSlug) {
        query = query.eq("product_slug", productSlug);
      }

      const { data: purchases } = await query;
      return purchases?.reduce((sum, p) => sum + Number(p.value || 0), 0) || 0;
    }

    return 0;
  } catch (error) {
    console.error("Error calculating current value:", error);
    return 0;
  }
}

export const useCreateCampaignGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newGoal: {
      campaign_id: string;
      metric_type: string;
      target_value: number;
      product_slug?: string;
      start_date: string;
      end_date: string;
    }) => {
      // Generate name based on metric type
      const metricNames = {
        leads: "Leads",
        sales: "Vendas",
        revenue: "Receita"
      };
      const name = `Meta de ${metricNames[newGoal.metric_type as keyof typeof metricNames]}`;

      const user_id = await getCurrentUserId();
      const { data, error } = await supabase
        .from("goals")
        .insert([{
          name,
          metric_type: newGoal.metric_type,
          target_value: newGoal.target_value,
          campaign_id: newGoal.campaign_id,
          product_slug: newGoal.product_slug || null,
          start_date: newGoal.start_date,
          end_date: newGoal.end_date,
          period_type: "monthly",
          status: "active",
          user_id,
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-goals", variables.campaign_id] });
      toast.success("Meta criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar meta: ${error.message}`);
    },
  });
};

export const useUpdateCampaignGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaign_id, ...updates }: Partial<CampaignGoal> & { id: string; campaign_id: string }) => {
      const { data, error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, campaign_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-goals", result.campaign_id] });
      toast.success("Meta atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar meta: ${error.message}`);
    },
  });
};

export const useDeleteCampaignGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaign_id }: { id: string; campaign_id: string }) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
      return campaign_id;
    },
    onSuccess: (campaign_id) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-goals", campaign_id] });
      toast.success("Meta excluída com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir meta: ${error.message}`);
    },
  });
};
