import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { FacebookCampaignHierarchical } from "@/hooks/useFacebookAdsHierarchicalReports";

interface FacebookClicksByCampaignChartProps {
  campaigns: FacebookCampaignHierarchical[];
}

export function FacebookClicksByCampaignChart({
  campaigns,
}: FacebookClicksByCampaignChartProps) {
  const chartData = campaigns
    .map((c) => ({
      name: c.campaign_name.length > 8 
        ? c.campaign_name.substring(0, 8) 
        : c.campaign_name,
      fullName: c.campaign_name,
      clicks: c.metrics.clicks,
      reach: Math.round(c.metrics.reach / 100), // Scale down for visualization
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 12);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-xl shadow-lg">
          <p className="font-semibold text-sm text-foreground mb-2">
            {data?.fullName}
          </p>
          <div className="space-y-1 text-xs">
            <p className="text-primary">
              Cliques: {data?.clicks?.toLocaleString("pt-BR")}
            </p>
            <p className="text-muted-foreground">
              Alcance: {(data?.reach * 100)?.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Cliques por Campanha
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            Sem dados disponíveis
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 30 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                  return v;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="reach"
                name="Alcance (x100)"
                fill="hsl(var(--muted-foreground))"
                radius={[2, 2, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="clicks"
                name="Cliques"
                fill="hsl(var(--primary))"
                radius={[2, 2, 0, 0]}
                stackId="b"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
