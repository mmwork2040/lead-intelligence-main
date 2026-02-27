import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type LeadEvent = Database["public"]["Tables"]["lead_events"]["Row"];

export const useLeadEvents = (leadId: string) => {
  return useQuery({
    queryKey: ["lead-events", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_events")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeadEvent[];
    },
    enabled: !!leadId,
  });
};
