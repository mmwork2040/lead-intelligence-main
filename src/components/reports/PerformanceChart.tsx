import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PerformanceChartProps {
  startDate: string;
  endDate: string;
  campaignId?: string;
}

export function PerformanceChart({
  startDate,
  endDate,
  campaignId,
}: PerformanceChartProps) {
  const { data: chartData } = useQuery({
    queryKey: ["facebook-performance-chart", startDate, endDate, campaignId],
    queryFn: async () => {
      let query = supabase
        .from("fb_metrics")
        .select("date_start, spend, conversions, clicks, impressions")
        .gte("date_start", startDate)
        .lte("date_stop", endDate)
        .order("date_start", { ascending: true });

      if (campaignId) {
        query = query.eq("fb_campaign_id", campaignId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by date
      const aggregated = new Map<string, { spend: number; conversions: number; clicks: number; impressions: number }>();

      data?.forEach((metric) => {
        const date = metric.date_start;
        if (!aggregated.has(date)) {
          aggregated.set(date, { spend: 0, conversions: 0, clicks: 0, impressions: 0 });
        }
        const agg = aggregated.get(date)!;
        agg.spend += typeof metric.spend === 'number' ? metric.spend : parseFloat(metric.spend || "0");
        agg.conversions += metric.conversions || 0;
        agg.clicks += metric.clicks || 0;
        agg.impressions += metric.impressions || 0;
      });

      return Array.from(aggregated.entries())
        .map(([date, metrics]) => ({
          date: new Date(date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
          Gasto: metrics.spend,
          Conversões: metrics.conversions,
          Cliques: metrics.clicks,
          Impressões: metrics.impressions / 1000, // Normalize for chart
        }))
        .sort((a, b) => {
          const [dayA, monthA] = a.date.split("/");
          const [dayB, monthB] = b.date.split("/");
          return new Date(`2024-${monthA}-${dayA}`).getTime() - new Date(`2024-${monthB}-${dayB}`).getTime();
        });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performance ao Longo do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="Gasto"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorSpend)"
            />
            <Area
              type="monotone"
              dataKey="Conversões"
              stroke="hsl(var(--accent))"
              fillOpacity={1}
              fill="url(#colorConversions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
