import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FacebookAd {
  id: string;
  fb_ad_id: string;
  fb_adset_id: string;
  fb_campaign_id: string;
  name: string;
  status: string | null;
  creative_id: string | null;
  creative_name: string | null;
  creative_preview_url: string | null;
  created_at: string | null;
}

export function useFacebookAds(adsetId?: string) {
  return useQuery({
    queryKey: ["facebook-ads", adsetId],
    queryFn: async () => {
      let query = supabase
        .from("fb_ads")
        .select("*")
        .order("created_time", { ascending: false });

      if (adsetId) {
        query = query.eq("fb_adset_id", adsetId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FacebookAd[];
    },
    enabled: !!adsetId || adsetId === undefined,
  });
}
