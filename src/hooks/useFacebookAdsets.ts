import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FacebookAdset {
  id: string;
  fb_adset_id: string;
  fb_campaign_id: string;
  name: string;
  status: string | null;
  optimization_goal: string | null;
  billing_event: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  bid_amount: number | null;
  targeting: any;
  created_at: string | null;
}

export function useFacebookAdsets(campaignId?: string) {
  return useQuery({
    queryKey: ["facebook-adsets", campaignId],
    queryFn: async () => {
      let query = supabase
        .from("fb_adsets")
        .select("*")
        .order("created_time", { ascending: false });

      if (campaignId) {
        query = query.eq("fb_campaign_id", campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FacebookAdset[];
    },
    enabled: !!campaignId || campaignId === undefined,
  });
}
