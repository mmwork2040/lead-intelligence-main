import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodFilter, calculateDateRange } from "@/lib/dateUtils";
import { useIsDemo } from "@/contexts/DemoContext";
import { demoFinancialMetrics } from "@/services/demoData";

export interface RevenueBySource {
  source: string;
  value: number;
  count: number;
}

export const useFinancialMetrics = (period?: PeriodFilter) => {
  const isDemo = useIsDemo();

  return useQuery({
    queryKey: ["financial-metrics", period, isDemo],
    queryFn: async () => {
      if (isDemo) return demoFinancialMetrics;
      const { startDate, endDate } = period 
        ? calculateDateRange(period) 
        : { startDate: new Date("2020-01-01"), endDate: new Date() };

      const { data: purchases } = await supabase
        .from("purchases")
        .select("value, utm_source, source")
        .eq("status", "approved")
        .gte("purchase_date", startDate.toISOString())
        .lte("purchase_date", endDate.toISOString());

      const { data: refundedPurchases } = await supabase
        .from("purchases")
        .select("value")
        .eq("status", "refunded")
        .gte("purchase_date", startDate.toISOString())
        .lte("purchase_date", endDate.toISOString());

      const revenue = purchases?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;
      const refunds = refundedPurchases?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;

      const sourceMap = new Map<string, { value: number; count: number }>();
      purchases?.forEach((p) => {
        const source = p.utm_source || p.source || "Direto";
        const current = sourceMap.get(source) || { value: 0, count: 0 };
        sourceMap.set(source, {
          value: current.value + (p.value || 0),
          count: current.count + 1,
        });
      });

      const revenueBySource: RevenueBySource[] = Array.from(sourceMap.entries())
        .map(([source, data]) => ({
          source: formatSourceName(source),
          value: data.value,
          count: data.count,
        }))
        .sort((a, b) => b.value - a.value);

      const { data: recurringPurchases } = await supabase
        .from("purchases")
        .select("value")
        .eq("status", "approved")
        .eq("is_recurring", true)
        .gte("purchase_date", startDate.toISOString())
        .lte("purchase_date", endDate.toISOString());

      const recurringRevenue = recurringPurchases?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;

      return {
        revenue,
        refunds,
        recurringRevenue,
        revenueBySource,
      };
    },
  });
};

function formatSourceName(source: string): string {
  const sourceNames: Record<string, string> = {
    facebook: "Facebook Ads",
    fb: "Facebook Ads",
    google: "Google Ads",
    instagram: "Instagram",
    ig: "Instagram",
    organic: "Orgânico",
    organico: "Orgânico",
    whatsapp: "WhatsApp",
    email: "E-mail",
    direct: "Direto",
    direto: "Direto",
  };
  
  const normalized = source.toLowerCase().trim();
  return sourceNames[normalized] || source;
}
