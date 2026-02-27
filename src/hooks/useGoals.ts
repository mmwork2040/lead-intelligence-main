import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Goal {
  id: string;
  name: string;
  description: string | null;
  metric_type: "leads" | "sales" | "revenue";
  target_value: number;
  current_value: number;
  period_type: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  start_date: string;
  end_date: string;
  campaign_id: string | null;
  product_slug: string | null;
  status: "active" | "completed" | "cancelled";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  campaigns?: { name: string };
}

export const useGoals = (status?: string) => {
  return useQuery({
    queryKey: ["goals", status],
    queryFn: async () => {
      let query = supabase
        .from("goals")
        .select("*, campaigns(name)")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate current values based on actual data
      const goalsWithProgress = await Promise.all(
        (data || []).map(async (goal: any) => {
          const currentValue = await calculateCurrentValue(
            goal.metric_type,
            goal.start_date,
            goal.end_date,
            goal.campaign_id,
            goal.product_slug
          );

          return {
            ...goal,
            current_value: currentValue,
          };
        })
      );

      return goalsWithProgress as Goal[];
    },
  });
};

async function calculateCurrentValue(
  metricType: string,
  startDate: string,
  endDate: string,
  campaignId: string | null,
  productSlug: string | null
): Promise<number> {
  try {
    if (metricType === "leads") {
      let query = supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (campaignId) {
        query = query.eq("project_slug", campaignId);
      }

      const { count } = await query;
      return count || 0;
    }

    if (metricType === "sales") {
      let query = supabase
        .from("purchases")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate);

      if (productSlug) {
        query = query.eq("product_slug", productSlug);
      }
      if (campaignId) {
        // Join with leads to filter by campaign
        const { data: purchases } = await supabase
          .from("purchases")
          .select("*, leads!inner(*)")
          .eq("status", "approved")
          .gte("purchase_date", startDate)
          .lte("purchase_date", endDate)
          .eq("leads.project_slug", campaignId);
        
        return purchases?.length || 0;
      }

      const { count } = await query;
      return count || 0;
    }

    if (metricType === "revenue") {
      let query = supabase
        .from("purchases")
        .select("value")
        .eq("status", "approved")
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate);

      if (productSlug) {
        query = query.eq("product_slug", productSlug);
      }

      if (campaignId) {
        const { data: purchases } = await supabase
          .from("purchases")
          .select("value, leads!inner(*)")
          .eq("status", "approved")
          .gte("purchase_date", startDate)
          .lte("purchase_date", endDate)
          .eq("leads.project_slug", campaignId);

        return purchases?.reduce((sum, p) => sum + Number(p.value || 0), 0) || 0;
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

export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newGoal: {
      name: string;
      description?: string;
      metric_type: string;
      target_value: number;
      period_type: string;
      start_date: string;
      end_date: string;
      campaign_id?: string;
      product_slug?: string;
    }) => {
      const { data, error } = await supabase
        .from("goals")
        .insert([{
          name: newGoal.name,
          description: newGoal.description,
          metric_type: newGoal.metric_type,
          target_value: newGoal.target_value,
          period_type: newGoal.period_type,
          start_date: newGoal.start_date,
          end_date: newGoal.end_date,
          campaign_id: newGoal.campaign_id || null,
          product_slug: newGoal.product_slug || null,
          status: 'active',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar meta: ${error.message}`);
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar meta: ${error.message}`);
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta excluída com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir meta: ${error.message}`);
    },
  });
};
