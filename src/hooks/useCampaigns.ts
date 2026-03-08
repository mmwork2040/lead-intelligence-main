import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentUserId } from "@/lib/getCurrentUserId";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useIsDemo } from "@/contexts/DemoContext";
import { demoCampaigns } from "@/services/demoData";

type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];
type CampaignUpdate = Database["public"]["Tables"]["campaigns"]["Update"];

// Extended type with is_active field (added via migration)
export type Campaign = CampaignRow & { is_active?: boolean };

export type CampaignFilter = 'all' | 'active' | 'inactive';

export const useCampaigns = (filter: CampaignFilter = 'all') => {
  const { user } = useAuth();
  const isDemo = useIsDemo();

  return useQuery({
    queryKey: ["campaigns", user?.id, filter, isDemo],
    queryFn: async (): Promise<Campaign[]> => {
      if (isDemo) return demoCampaigns as Campaign[];
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const campaigns = (data || []) as Campaign[];

      if (filter === "active") {
        return campaigns.filter(c => c.is_active !== false);
      } else if (filter === "inactive") {
        return campaigns.filter(c => c.is_active === false);
      }

      return campaigns;
    },
    enabled: !!user,
  });
};

// Hook para contar campanhas por status
export const useCampaignCounts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["campaign-counts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, is_active");

      if (error) throw error;

      const campaigns = (data || []) as Campaign[];
      const total = campaigns.length;
      const active = campaigns.filter(c => c.is_active !== false).length;
      const inactive = total - active;

      return { total, active, inactive };
    },
    enabled: !!user,
  });
};

// Hook para alternar status ativo/inativo
export const useToggleCampaignStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .update({ is_active } as any) // is_active added via migration, not yet in generated types
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-counts"] });
      toast.success(variables.is_active ? "Campanha ativada!" : "Campanha desativada!");
    },
    onError: (error: any) => {
      console.error("Error toggling campaign status:", error);
      toast.error("Erro ao alterar status da campanha");
    },
  });
};

export const useCampaign = (slug: string) => {
  return useQuery({
    queryKey: ["campaigns", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    enabled: !!slug,
  });
};

export const useCampaignMetrics = (slug: string, period?: { startDate: Date | null; endDate: Date | null }) => {
  return useQuery({
    queryKey: ["campaign-metrics", slug, period?.startDate?.toISOString(), period?.endDate?.toISOString()],
    queryFn: async () => {
      // Get leads count with date filter
      let leadsQuery = supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("project_slug", slug);

      if (period?.startDate) {
        leadsQuery = leadsQuery.gte("created_at", period.startDate.toISOString());
      }
      if (period?.endDate) {
        leadsQuery = leadsQuery.lte("created_at", period.endDate.toISOString());
      }

      const { count: leadsCount } = await leadsQuery;

      // Get leads for this campaign
      let leadsDataQuery = supabase
        .from("leads")
        .select("lead_id")
        .eq("project_slug", slug);

      if (period?.startDate) {
        leadsDataQuery = leadsDataQuery.gte("created_at", period.startDate.toISOString());
      }
      if (period?.endDate) {
        leadsDataQuery = leadsDataQuery.lte("created_at", period.endDate.toISOString());
      }

      const { data: leads } = await leadsDataQuery;
      const leadIds = leads?.map((l) => l.lead_id) || [];

      let salesCount = 0;
      let revenue = 0;

      if (leadIds.length > 0) {
        let purchasesQuery = supabase
          .from("purchases")
          .select("value")
          .in("lead_id", leadIds);

        if (period?.startDate) {
          purchasesQuery = purchasesQuery.gte("purchase_date", period.startDate.toISOString());
        }
        if (period?.endDate) {
          purchasesQuery = purchasesQuery.lte("purchase_date", period.endDate.toISOString());
        }

        const { data: purchases } = await purchasesQuery;

        salesCount = purchases?.length || 0;
        revenue = purchases?.reduce((sum, p) => sum + (Number(p.value) || 0), 0) || 0;
      }

      // Get campaign ad spend
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("ad_spend")
        .eq("slug", slug)
        .single();

      const adSpend = Number(campaign?.ad_spend) || 0;
      const roas = adSpend > 0 ? revenue / adSpend : 0;

      return {
        leads: leadsCount || 0,
        sales: salesCount,
        revenue,
        adSpend,
        roas,
      };
    },
    enabled: !!slug,
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: CampaignInsert) => {
      const user_id = await getCurrentUserId();
      const { data, error } = await supabase
        .from("campaigns")
        .insert({ ...campaign, user_id } as any)
        .select()
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campanha criada com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error creating campaign:", error);
      toast.error(error.message || "Erro ao criar campanha");
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CampaignUpdate }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campanha atualizada com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error updating campaign:", error);
      toast.error(error.message || "Erro ao atualizar campanha");
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campanha excluída com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error deleting campaign:", error);
      toast.error(error.message || "Erro ao excluir campanha");
    },
  });
};
