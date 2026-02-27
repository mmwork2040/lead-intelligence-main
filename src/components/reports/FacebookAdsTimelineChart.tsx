import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PeriodFilter, getDateRange } from "@/lib/dateUtils";

interface FacebookAdsTimelineChartProps {
  selectedMetrics: string[];
  period: PeriodFilter;
}

const metricLabels: Record<string, string> = {
  impressions: "Impressões",
  reach: "Alcance",
  clicks: "Cliques",
  spend: "Gasto",
  cpm: "CPM",
  cpc: "CPC",
  ctr: "CTR",
  frequency: "Frequência",
  conversions: "Conversões",
  costPerConversion: "Custo/Conv",
  roas: "ROAS",
};

const metricColors: Record<string, string> = {
  impressions: "hsl(var(--chart-1))",
  reach: "hsl(var(--chart-2))",
  clicks: "hsl(var(--chart-3))",
  spend: "hsl(var(--chart-4))",
  cpm: "hsl(var(--chart-5))",
  cpc: "hsl(var(--chart-1))",
  ctr: "hsl(var(--chart-2))",
  frequency: "hsl(var(--chart-3))",
  conversions: "hsl(var(--chart-4))",
  costPerConversion: "hsl(var(--chart-5))",
  roas: "hsl(var(--chart-1))",
};

export function FacebookAdsTimelineChart({ selectedMetrics, period }: FacebookAdsTimelineChartProps) {
  const { data: timelineData, isLoading } = useQuery({
    queryKey: ["facebook-ads-timeline", period],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange(period);
      
      // Fetch metrics grouped by date
      let query = supabase
        .from("fb_metrics")
        .select("*")
        .order("date_start", { ascending: true });

      if (startDate) {
        query = query.gte("date_start", startDate.toISOString().split("T")[0]);
      }
      if (endDate) {
        query = query.lte("date_start", endDate.toISOString().split("T")[0]);
      }

      const { data: metrics, error } = await query;

      if (error) throw error;

      // Group by date and aggregate
      const dateMap = new Map<string, any>();

      metrics?.forEach((metric) => {
        const date = metric.date_start;
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            impressions: 0,
            reach: 0,
            clicks: 0,
            spend: 0,
            conversions: 0,
            cpm: 0,
            cpc: 0,
            ctr: 0,
            frequency: 0,
            costPerConversion: 0,
            count: 0,
          });
        }

        const entry = dateMap.get(date);
        entry.impressions += metric.impressions || 0;
        entry.reach += metric.reach || 0;
        entry.clicks += metric.clicks || 0;
        entry.spend += metric.spend || 0;
        entry.conversions += metric.conversions || 0;
        entry.count += 1;
      });

      // Calculate averages for ratio metrics
      const result = Array.from(dateMap.values()).map((entry) => ({
        ...entry,
        cpm: entry.impressions > 0 ? (entry.spend / entry.impressions) * 1000 : 0,
        cpc: entry.clicks > 0 ? entry.spend / entry.clicks : 0,
        ctr: entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0,
        frequency: entry.reach > 0 ? entry.impressions / entry.reach : 0,
        costPerConversion: entry.conversions > 0 ? entry.spend / entry.conversions : 0,
      }));

      // Fetch ROAS data
      const { data: purchases } = await supabase
        .from("purchases")
        .select("purchase_date, value")
        .eq("status", "approved");

      // Map purchases by date
      const purchaseMap = new Map<string, number>();
      purchases?.forEach((purchase) => {
        const date = purchase.purchase_date?.split("T")[0];
        if (date) {
          purchaseMap.set(date, (purchaseMap.get(date) || 0) + (purchase.value || 0));
        }
      });

      // Add ROAS to result
      result.forEach((entry) => {
        const revenue = purchaseMap.get(entry.date) || 0;
        entry.roas = entry.spend > 0 ? revenue / entry.spend : 0;
      });

      return result;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!timelineData || timelineData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução Temporal</CardTitle>
          <CardDescription>Nenhum dado disponível</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Format data for chart
  const chartData = timelineData.map((entry) => ({
    date: format(new Date(entry.date), "dd/MMM", { locale: ptBR }),
    fullDate: entry.date,
    ...entry,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução Temporal das Métricas</CardTitle>
        <CardDescription>
          Acompanhe a performance das métricas selecionadas ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: any, name: string) => {
                const label = metricLabels[name] || name;
                if (name === "spend" || name === "cpm" || name === "cpc" || name === "costPerConversion") {
                  return [`R$ ${Number(value).toFixed(2)}`, label];
                }
                if (name === "ctr" || name === "frequency" || name === "roas") {
                  return [Number(value).toFixed(2), label];
                }
                return [Number(value).toLocaleString("pt-BR"), label];
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => metricLabels[value] || value}
            />
            {selectedMetrics.map((metric) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={metricColors[metric]}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={metric}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
