import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type WebhookLog = Database["public"]["Tables"]["webhook_logs"]["Row"];

export const useWebhookLogs = (filters?: {
  source?: string;
  processed?: boolean;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["webhook-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.source) {
        query = query.eq("source", filters.source);
      }

      if (filters?.processed !== undefined) {
        query = query.eq("processed", filters.processed);
      }

      query = query.limit(filters?.limit || 100);

      const { data, error } = await query;

      if (error) throw error;
      return data as WebhookLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useWebhookStats = () => {
  return useQuery({
    queryKey: ["webhook-stats"],
    queryFn: async () => {
      // Total logs
      const { count: total } = await supabase
        .from("webhook_logs")
        .select("*", { count: "exact", head: true });

      // Processed logs
      const { count: processed } = await supabase
        .from("webhook_logs")
        .select("*", { count: "exact", head: true })
        .eq("processed", true);

      // Failed logs (not processed and has error)
      const { count: failed } = await supabase
        .from("webhook_logs")
        .select("*", { count: "exact", head: true })
        .eq("processed", false)
        .not("error_message", "is", null);

      // By source
      const { data: bySource } = await supabase
        .from("webhook_logs")
        .select("source");

      const sourceCounts = bySource?.reduce((acc: Record<string, number>, log) => {
        acc[log.source] = (acc[log.source] || 0) + 1;
        return acc;
      }, {});

      return {
        total: total || 0,
        processed: processed || 0,
        failed: failed || 0,
        pending: (total || 0) - (processed || 0) - (failed || 0),
        bySource: sourceCounts || {},
      };
    },
    refetchInterval: 30000,
  });
};
