import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FacebookCampaign {
  id: string;
  fb_campaign_id: string;
  name: string;
  status: string | null;
  objective: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  campaign_slug: string | null;
  start_time: string | null;
  stop_time: string | null;
  created_at: string | null;
}

export function useFacebookCampaigns(status?: string) {
  return useQuery({
    queryKey: ["facebook-campaigns", status],
    queryFn: async () => {
      let query = supabase
        .from("fb_campaigns")
        .select("*")
        .order("created_time", { ascending: false });

      if (status && status !== "ALL") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FacebookCampaign[];
    },
  });
}
