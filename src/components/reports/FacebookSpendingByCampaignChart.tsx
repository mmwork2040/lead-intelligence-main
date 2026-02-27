import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { FacebookCampaignHierarchical } from "@/hooks/useFacebookAdsHierarchicalReports";

interface FacebookSpendingByCampaignChartProps {
  campaigns: FacebookCampaignHierarchical[];
}

const CHART_COLORS = [
  "hsl(160, 50%, 40%)",
  "hsl(38, 85%, 48%)",
  "hsl(72, 90%, 42%)",
  "hsl(24, 8%, 45%)",
  "hsl(0, 72%, 55%)",
];

export function FacebookSpendingByCampaignChart({
  campaigns,
}: FacebookSpendingByCampaignChartProps) {
  const chartData = campaigns
    .map((c) => ({
      name: c.campaign_name.length > 12 
        ? c.campaign_name.substring(0, 12) 
        : c.campaign_name,
      fullName: c.campaign_name,
      spend: c.metrics.spend,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-xl shadow-lg">
          <p className="font-semibold text-sm text-foreground">
            {payload[0]?.payload?.fullName}
          </p>
          <p className="text-primary font-medium mt-1">
            {formatValue(payload[0]?.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Gastos por Campanha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 60, left: 5, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              width={70}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="spend"
              radius={[0, 4, 4, 0]}
              label={{
                position: "right",
                formatter: formatValue,
                fill: "hsl(var(--foreground))",
                fontSize: 11,
              }}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
