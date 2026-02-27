import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { FacebookCampaignHierarchical } from "@/hooks/useFacebookAdsHierarchicalReports";

interface FacebookAdsPerformanceChartProps {
  campaigns: FacebookCampaignHierarchical[];
}

export function FacebookAdsPerformanceChart({ campaigns }: FacebookAdsPerformanceChartProps) {
  // Prepare data for chart
  const chartData = campaigns
    .map((campaign) => ({
      name: campaign.campaign_name.length > 20
        ? campaign.campaign_name.substring(0, 20) + "..."
        : campaign.campaign_name,
      fullName: campaign.campaign_name,
      gasto: Number(campaign.metrics.spend.toFixed(2)),
      conversoes: campaign.metrics.conversions,
      roas: Number(campaign.metrics.roas.toFixed(2)),
    }))
    .sort((a, b) => b.gasto - a.gasto)
    .slice(0, 10); // Top 10 campaigns by spend

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2">{payload[0]?.payload?.fullName}</p>
          <div className="space-y-1 text-xs">
            <p className="text-[hsl(var(--chart-1))]">
              Gasto: R$ {payload[0]?.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[hsl(var(--chart-2))]">
              Conversões: {payload[1]?.value}
            </p>
            <p className="text-[hsl(var(--chart-5))]">
              ROAS: {payload[2]?.value?.toFixed(2)}x
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance de Campanhas</CardTitle>
        <CardDescription>
          Gasto publicitário vs Conversões (Top 10 campanhas)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              className="text-xs"
            />
            <YAxis
              yAxisId="left"
              label={{ value: 'Gasto (R$)', angle: -90, position: 'insideLeft' }}
              className="text-xs"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Conversões', angle: 90, position: 'insideRight' }}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
            />
            <Bar
              yAxisId="left"
              dataKey="gasto"
              fill="hsl(var(--chart-1))"
              name="Gasto (R$)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="conversoes"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              name="Conversões"
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roas"
              stroke="hsl(var(--chart-5))"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="ROAS"
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
