import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PeriodFilter, getDateRange } from "@/lib/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";

interface FacebookReachChartProps {
  period: PeriodFilter;
}

export function FacebookReachChart({ period }: FacebookReachChartProps) {
  const { data: timelineData, isLoading } = useQuery({
    queryKey: ["facebook-reach-timeline", period],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange(period);

      let query = supabase
        .from("fb_metrics")
        .select("date_start, reach, impressions")
        .order("date_start", { ascending: true });

      if (startDate) {
        query = query.gte("date_start", startDate.toISOString().split("T")[0]);
      }
      if (endDate) {
        query = query.lte("date_start", endDate.toISOString().split("T")[0]);
      }

      const { data: metrics, error } = await query;
      if (error) throw error;

      // Group by date
      const dateMap = new Map<string, { reach: number; impressions: number }>();

      metrics?.forEach((m) => {
        const date = m.date_start;
        if (!dateMap.has(date)) {
          dateMap.set(date, { reach: 0, impressions: 0 });
        }
        const entry = dateMap.get(date)!;
        entry.reach += m.reach || 0;
        entry.impressions += m.impressions || 0;
      });

      return Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          formattedDate: format(new Date(date), "dd MMM", { locale: ptBR }),
          reach: data.reach,
          impressions: data.impressions,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    staleTime: 5 * 60 * 1000,
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-xl shadow-lg">
          <p className="font-semibold text-sm text-foreground mb-2">
            {data?.formattedDate}
          </p>
          <div className="space-y-1 text-xs">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Alcance: {data?.reach?.toLocaleString("pt-BR")}
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              Impressões: {data?.impressions?.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Alcance e Impressões por Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Alcance e Impressões por Data
          </CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Alcance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">Impressões</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!timelineData || timelineData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Sem dados disponíveis
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={timelineData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--muted-foreground))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--muted-foreground))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="formattedDate"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                  return v;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="impressions"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                fill="url(#impressionsGradient)"
              />
              <Area
                type="monotone"
                dataKey="reach"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#reachGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
