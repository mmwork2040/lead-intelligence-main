import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MetricCard from "@/components/MetricCard";
import { UnifiedReportMetrics } from "@/hooks/useUnifiedReportMetrics";
import { Users, ShoppingCart, DollarSign, TrendingUp, Target, Percent } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportTabGeneralProps {
  metrics: UnifiedReportMetrics;
}

export const ReportTabGeneral = ({ metrics }: ReportTabGeneralProps) => {
  const formatCurrency = (value: number) => 
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatChange = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const chartData = metrics.dailyData.map(d => ({
    ...d,
    dateFormatted: format(new Date(d.date), "dd/MM", { locale: ptBR })
  }));

  const sourceChartData = metrics.sourceMetrics.slice(0, 6).map(s => ({
    name: s.source,
    leads: s.leads,
    vendas: s.sales
  }));

  return (
    <div className="space-y-6">
      {/* Métricas Resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Leads"
          value={metrics.totalLeads.toLocaleString("pt-BR")}
          change={{ value: formatChange(metrics.leadsChange), trend: metrics.leadsChange >= 0 ? "up" : "down" }}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="Vendas"
          value={metrics.totalSales.toLocaleString("pt-BR")}
          change={{ value: formatChange(metrics.salesChange), trend: metrics.salesChange >= 0 ? "up" : "down" }}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <MetricCard
          title="Receita"
          value={formatCurrency(metrics.totalRevenue)}
          change={{ value: formatChange(metrics.revenueChange), trend: metrics.revenueChange >= 0 ? "up" : "down" }}
          icon={<DollarSign className="h-4 w-4" />}
          iconColor="green"
        />
        <MetricCard
          title="Investimento"
          value={formatCurrency(metrics.totalAdSpend)}
          icon={<Target className="h-4 w-4" />}
          iconColor="orange"
        />
        <MetricCard
          title="ROAS"
          value={`${metrics.roas}x`}
          icon={<TrendingUp className="h-4 w-4" />}
          iconColor={parseFloat(metrics.roas) >= 1 ? "green" : "red"}
        />
        <MetricCard
          title="Conversão"
          value={`${metrics.conversionRate}%`}
          icon={<Percent className="h-4 w-4" />}
          iconColor="green"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Diária */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução Diária</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dateFormatted" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="hsl(var(--primary))" 
                    name="Leads"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="hsl(var(--chart-2))" 
                    name="Vendas"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados para o período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance por Origem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourceChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" name="Leads" />
                  <Bar dataKey="vendas" fill="hsl(var(--chart-2))" name="Vendas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados para o período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.productMetrics.length > 0 ? (
              <div className="space-y-3">
                {metrics.productMetrics.slice(0, 5).map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {product.productName}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatCurrency(product.revenue)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {product.sales} vendas
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Top Campanhas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.campaignMetrics.length > 0 ? (
              <div className="space-y-3">
                {metrics.campaignMetrics.slice(0, 5).map((campaign, index) => (
                  <div key={campaign.campaignId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {campaign.campaignName}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">
                        {campaign.roas}x ROAS
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(campaign.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Top Origens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Origens</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.sourceMetrics.length > 0 ? (
              <div className="space-y-3">
                {metrics.sourceMetrics.slice(0, 5).map((source, index) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {source.source}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {source.leads} leads
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {source.conversion}% conv.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
