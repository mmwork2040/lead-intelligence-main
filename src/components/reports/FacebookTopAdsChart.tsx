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

interface FacebookTopAdsChartProps {
  campaigns: FacebookCampaignHierarchical[];
  type: "spend" | "conversions";
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function FacebookTopAdsChart({ campaigns, type }: FacebookTopAdsChartProps) {
  // Extract all ads from all campaigns/adsets
  const allAds = campaigns.flatMap((campaign) =>
    campaign.adsets.flatMap((adset) =>
      adset.ads.map((ad) => ({
        name: ad.ad_name.length > 15
          ? ad.ad_name.substring(0, 15) + "..."
          : ad.ad_name,
        fullName: ad.ad_name,
        value: type === "spend" ? ad.metrics.spend : ad.metrics.conversions,
        conversionRate: ad.metrics.impressions > 0
          ? ((ad.metrics.conversions / ad.metrics.impressions) * 100).toFixed(1)
          : "0",
      }))
    )
  );

  const chartData = allAds
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const formatValue = (value: number) => {
    if (type === "spend") {
      if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(1)}K`;
      }
      return `R$ ${value.toFixed(0)}`;
    }
    return `${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-xl shadow-lg">
          <p className="font-semibold text-sm text-foreground">{data?.fullName}</p>
          <p className="text-primary font-medium mt-1">
            {type === "spend"
              ? `R$ ${data?.value?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              : `${data?.conversionRate}%`
            }
          </p>
        </div>
      );
    }
    return null;
  };

  const title = type === "spend" ? "Top Anúncios por Gasto" : "Top Anúncios por Conversão";

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Sem dados disponíveis
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 60, left: 5, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                width={80}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={type === "conversions" ? "conversionRate" : "value"}
                radius={[0, 4, 4, 0]}
                label={{
                  position: "right",
                  formatter: (v: number) => type === "spend" ? formatValue(v) : `${v}%`,
                  fill: "hsl(var(--foreground))",
                  fontSize: 10,
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
        )}
      </CardContent>
    </Card>
  );
}
