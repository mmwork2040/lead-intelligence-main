import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

export type FBCampaign = Database["public"]["Tables"]["fb_campaigns"]["Row"];
export type FBAdSet = Database["public"]["Tables"]["fb_adsets"]["Row"];
export type FBAd = Database["public"]["Tables"]["fb_ads"]["Row"];

export const useMetaCampaigns = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["meta-campaigns"],
        queryFn: async (): Promise<FBCampaign[]> => {
            const { data, error } = await supabase
                .from("fb_campaigns")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data || []) as FBCampaign[];
        },
        enabled: !!user,
    });
};

export const useMetaAdSets = (campaignId?: string) => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["meta-adsets", campaignId],
        queryFn: async (): Promise<FBAdSet[]> => {
            let query = supabase.from("fb_adsets").select("*").order("created_at", { ascending: false });
            if (campaignId) {
                query = query.eq("fb_campaign_id", campaignId);
            }
            const { data, error } = await query;
            if (error) throw error;
            return (data || []) as FBAdSet[];
        },
        enabled: !!user,
    });
};

export const useMetaAds = (adSetId?: string) => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["meta-ads", adSetId],
        queryFn: async (): Promise<FBAd[]> => {
            let query = supabase.from("fb_ads").select("*").order("created_at", { ascending: false });
            if (adSetId) {
                query = query.eq("fb_adset_id", adSetId);
            }
            const { data, error } = await query;
            if (error) throw error;
            return (data || []) as FBAd[];
        },
        enabled: !!user,
    });
};

export const useToggleMetaStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            fb_id,
            status,
            type,
        }: {
            fb_id: string;
            status: "ACTIVE" | "PAUSED";
            type: "CAMPAIGN" | "ADSET" | "AD";
        }) => {
            const { data, error } = await supabase.functions.invoke("toggle-facebook-status", {
                body: { fb_id, status, type },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            // Invalidate relevant queries based on the type
            if (variables.type === "CAMPAIGN") queryClient.invalidateQueries({ queryKey: ["meta-campaigns"] });
            if (variables.type === "ADSET") queryClient.invalidateQueries({ queryKey: ["meta-adsets"] });
            if (variables.type === "AD") queryClient.invalidateQueries({ queryKey: ["meta-ads"] });

            toast.success(
                `${variables.type === 'CAMPAIGN' ? 'Campanha' : variables.type === 'ADSET' ? 'Conjunto' : 'Anúncio'} ${variables.status === "ACTIVE" ? "ativado" : "pausado"
                } com sucesso no Meta!`
            );
        },
        onError: (error: any) => {
            console.error("Error toggling meta status:", error);
            toast.error("Erro ao alterar status no Meta Ads");
        },
    });
};
