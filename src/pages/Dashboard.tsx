import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  MessageSquare,
  ShoppingCart,
  UserPlus,
  UserCheck,
  RefreshCw,
  ArrowUpRight,
  Megaphone,
  ExternalLink,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ChartTabs from "@/components/dashboard/ChartTabs";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { PageAIInsights } from "@/components/ai/PageAIInsights";
import { getPeriodLabel } from "@/lib/dateUtils";
import { AIReportInsights } from "@/components/reports/AIReportInsights";
import { ReportTabGeneral } from "@/components/reports/ReportTabGeneral";
import { ReportTabProducts } from "@/components/reports/ReportTabProducts";
import { ReportTabCampaigns } from "@/components/reports/ReportTabCampaigns";
import { useUnifiedReportMetrics } from "@/hooks/useUnifiedReportMetrics";
import { useState, useEffect } from "react";
import { PeriodFilter } from "@/lib/dateUtils";
import { getEventLabel } from "@/lib/translations";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useProducts } from "@/hooks/useProducts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Package, Filter, Activity } from "lucide-react";
const DASHBOARD_PERIOD_KEY = "dashboard_period";

const getActivityConfig = (activityType: string) => {
  switch (activityType) {
    case "cliente":
      return {
        icon: UserCheck,
        label: "Novo Cliente",
        bgColor: "bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)]",
        iconColor: "text-[hsl(160,55%,40%)] dark:text-[#CCFF00]"
      };
    case "status_change":
      return {
        icon: RefreshCw,
        label: "Mudança de Status",
        bgColor: "bg-[rgba(245,158,11,0.10)] dark:bg-[rgba(245,158,11,0.08)]",
        iconColor: "text-[hsl(38,92%,45%)] dark:text-[hsl(45,100%,55%)]"
      };
    case "lead":
    default:
      return {
        icon: UserPlus,
        label: "Novo Lead",
        bgColor: "bg-[rgba(59,130,246,0.12)] dark:bg-[rgba(59,130,246,0.10)]",
        iconColor: "text-[hsl(217,91%,55%)] dark:text-[hsl(217,91%,70%)]"
      };
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  // Persistir período selecionado no localStorage
  const [period, setPeriod] = useState<PeriodFilter>(() => {
    const saved = localStorage.getItem(DASHBOARD_PERIOD_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as PeriodFilter;
      } catch {
        return { type: "7d" };
      }
    }
    return { type: "7d" };
  });
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // Salvar período no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem(DASHBOARD_PERIOD_KEY, JSON.stringify(period));
  }, [period]);

  const { data: campaigns } = useCampaigns();
  const { data: products } = useProducts();

  const { data: metrics, isLoading } = useDashboardMetrics({
    period,
    campaignSlug: selectedCampaign,
    productSlug: selectedProduct,
  });

  const { data: unifiedMetrics, isLoading: isUnifiedLoading } = useUnifiedReportMetrics(period);

  const [activeReportTab, setActiveReportTab] = useState("geral");

  // Filter unified metrics based on selected filters
  const filteredUnifiedMetrics = unifiedMetrics ? {
    ...unifiedMetrics,
    productMetrics: selectedProduct
      ? unifiedMetrics.productMetrics.filter(p => p.productSlug === selectedProduct)
      : unifiedMetrics.productMetrics,
    campaignMetrics: selectedCampaign
      ? unifiedMetrics.campaignMetrics.filter(c => c.campaignSlug === selectedCampaign)
      : unifiedMetrics.campaignMetrics,
    sourceMetrics: unifiedMetrics.sourceMetrics,
    dailyData: unifiedMetrics.dailyData,
    // Recalculate totals based on filters
    totalLeads: selectedProduct || selectedCampaign
      ? (selectedProduct
        ? unifiedMetrics.productMetrics.filter(p => p.productSlug === selectedProduct).reduce((sum, p) => sum + p.leads, 0)
        : unifiedMetrics.campaignMetrics.filter(c => c.campaignSlug === selectedCampaign).reduce((sum, c) => sum + c.leads, 0))
      : unifiedMetrics.totalLeads,
    totalSales: selectedProduct || selectedCampaign
      ? (selectedProduct
        ? unifiedMetrics.productMetrics.filter(p => p.productSlug === selectedProduct).reduce((sum, p) => sum + p.sales, 0)
        : unifiedMetrics.campaignMetrics.filter(c => c.campaignSlug === selectedCampaign).reduce((sum, c) => sum + c.sales, 0))
      : unifiedMetrics.totalSales,
    totalRevenue: selectedProduct || selectedCampaign
      ? (selectedProduct
        ? unifiedMetrics.productMetrics.filter(p => p.productSlug === selectedProduct).reduce((sum, p) => sum + p.revenue, 0)
        : unifiedMetrics.campaignMetrics.filter(c => c.campaignSlug === selectedCampaign).reduce((sum, c) => sum + c.revenue, 0))
      : unifiedMetrics.totalRevenue,
    totalAdSpend: selectedCampaign
      ? unifiedMetrics.campaignMetrics.filter(c => c.campaignSlug === selectedCampaign).reduce((sum, c) => sum + c.investment, 0)
      : unifiedMetrics.totalAdSpend
  } : null;

  if (filteredUnifiedMetrics) {
    filteredUnifiedMetrics.roas = filteredUnifiedMetrics.totalAdSpend > 0
      ? (filteredUnifiedMetrics.totalRevenue / filteredUnifiedMetrics.totalAdSpend).toFixed(2)
      : "0.00";
    filteredUnifiedMetrics.conversionRate = filteredUnifiedMetrics.totalLeads > 0
      ? ((filteredUnifiedMetrics.totalSales / filteredUnifiedMetrics.totalLeads) * 100).toFixed(1)
      : "0.0";
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageSkeleton variant="default" metrics={5} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Visão geral do desempenho das suas campanhas e vendas
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelector value={period} onChange={setPeriod} />

            <Select
              value={selectedCampaign || "all"}
              onValueChange={(v) => setSelectedCampaign(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[160px] h-9 bg-card border-border/50 rounded-xl">
                <SelectValue placeholder="Campanhas" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50">
                <SelectItem value="all">Todas campanhas</SelectItem>
                {campaigns?.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedProduct || "all"}
              onValueChange={(v) => setSelectedProduct(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[160px] h-9 bg-card border-border/50 rounded-xl">
                <SelectValue placeholder="Produtos" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50">
                <SelectItem value="all">Todos produtos</SelectItem>
                {products?.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:shadow-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg data-[state=active]:shadow-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Relatórios Detalhados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PageAIInsights
              title="Insights de IA — Dashboard"
              context="dashboard"
              canGenerate={(metrics?.totalLeads || 0) > 0 || (metrics?.totalSales || 0) > 0}
              isLoading={isLoading}
              resetKeys={[period.type, (period as any).startDate, (period as any).endDate]}
              prompt={`Analise os dados do dashboard de marketing digital abaixo e forneça insights estratégicos em português brasileiro:

Período: ${getPeriodLabel(period)}
- Total de Leads: ${metrics?.totalLeads || 0}
- Vendas: ${metrics?.totalSales || 0}
- Receita Total: R$ ${(metrics?.totalRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Investimento: R$ ${(metrics?.totalAdSpend || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Taxa de Conversão: ${metrics?.conversionRate || "0%"}
- ROAS: ${metrics?.roas || "0x"}
- Variação Leads: ${metrics?.leadsChange || "0%"}
- Variação Vendas: ${metrics?.salesChange || "0%"}
- Variação Receita: ${metrics?.revenueChange || "0%"}

Responda com:
1. Resumo executivo (1-2 frases)
2. 3-5 insights específicos numerados com emojis
3. 2-3 ações recomendadas para otimização

Seja conciso e direto. Use dados concretos.`}
            />

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <MetricCard
                title="Total de Leads"
                value={metrics?.totalLeads.toLocaleString("pt-BR") || "0"}
                change={{
                  value: metrics?.leadsChange || "0%",
                  trend: metrics?.leadsChangeTrend as "up" | "down" | "neutral" || "neutral"
                }}
                icon={<Users className="h-5 w-5" />}
                iconColor="blue"
                tooltip="Número total de leads capturados no período selecionado"
                className="animate-fade-in"
                style={{ animationDelay: "0ms" }}
              />
              <MetricCard
                title="Vendas"
                value={metrics?.totalSales?.toLocaleString("pt-BR") || "0"}
                change={{
                  value: metrics?.salesChange || "0%",
                  trend: metrics?.salesChangeTrend as "up" | "down" | "neutral" || "neutral"
                }}
                icon={<ShoppingCart className="h-5 w-5" />}
                iconColor="green"
                tooltip="Quantidade de vendas aprovadas no período"
                className="animate-fade-in"
                style={{ animationDelay: "50ms" }}
              />
              <MetricCard
                title="Receita Total"
                value={`R$ ${(metrics?.totalRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                change={{
                  value: metrics?.revenueChange || "0%",
                  trend: metrics?.revenueChangeTrend as "up" | "down" | "neutral" || "neutral"
                }}
                icon={<DollarSign className="h-5 w-5" />}
                iconColor="orange"
                tooltip="Valor líquido total das vendas (após taxas de plataforma)"
                className="animate-fade-in"
                style={{ animationDelay: "100ms" }}
                onClick={() => navigate("/financial")}
              />
              <MetricCard
                title="Investimento"
                value={`R$ ${(metrics?.totalAdSpend || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                change={{
                  value: metrics?.adSpendChange || "0%",
                  trend: metrics?.adSpendChangeTrend as "up" | "down" | "neutral" || "neutral"
                }}
                icon={<Megaphone className="h-5 w-5" />}
                iconColor="red"
                tooltip="Valor total investido em tráfego pago no período"
                className="animate-fade-in"
                style={{ animationDelay: "150ms" }}
                onClick={() => navigate("/reports")}
              />
              <MetricCard
                title="Taxa de Conversão"
                value={metrics?.conversionRate || "0%"}
                icon={<Target className="h-5 w-5" />}
                iconColor="purple"
                tooltip="Porcentagem de leads que se tornaram compradores"
                className="animate-fade-in"
                style={{ animationDelay: "200ms" }}
              />
              <MetricCard
                title="ROAS"
                value={metrics?.roas || "0x"}
                icon={<TrendingUp className="h-5 w-5" />}
                iconColor="cyan"
                tooltip="Retorno sobre investimento em anúncios (Receita ÷ Investimento)"
                className="animate-fade-in"
                style={{ animationDelay: "250ms" }}
              />
            </div>

            {/* Interactive Charts */}

            {/* Interactive Charts */}
            <ChartTabs
              chartData={metrics?.chartData || []}
              revenueData={metrics?.revenueData || []}
              sourceData={metrics?.sourceData || []}
              conversionData={metrics?.conversionData || []}
              topProductsData={metrics?.topProductsData || []}
            />

            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Atividade Recente</CardTitle>
                  <CardDescription>Novos leads e compras realizadas</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  Ver tudo
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.recentEvents && metrics.recentEvents.length > 0 ? (
                    metrics.recentEvents.map((activity: any) => {
                      const config = getActivityConfig(activity.activity_type);
                      const Icon = config.icon;

                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-5 w-5 ${config.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.iconColor}`}>
                                {config.label}
                              </span>
                            </div>
                            <p className="font-medium text-sm text-foreground mt-1 truncate">{activity.name}</p>

                            {/* Info adicional baseada no tipo */}
                            {activity.activity_type === "status_change" ? (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {activity.old_status || "novo"} → {activity.new_status || "atualizado"}
                              </p>
                            ) : (
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                {activity.product_name && (
                                  <span
                                    className="text-xs text-foreground/80"
                                    title={activity.products?.join(", ")}
                                  >
                                    {activity.product_name}
                                  </span>
                                )}
                                {activity.value && (
                                  <span className="text-xs font-semibold text-[hsl(160,55%,40%)] dark:text-[#CCFF00]">
                                    R$ {activity.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    {activity.purchase_count > 1 && (
                                      <span className="text-muted-foreground font-normal ml-1">
                                        ({activity.purchase_count} compras)
                                      </span>
                                    )}
                                  </span>
                                )}
                                {activity.is_recurring && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    ♻️ Recorrente
                                  </span>
                                )}
                                {activity.payment_method && (
                                  <span className="text-xs text-muted-foreground">
                                    {activity.payment_method === "PIX" ? "💳 PIX" :
                                      activity.payment_method === "CREDIT_CARD" ? "💳 Cartão" :
                                        activity.payment_method === "BILLET" ? "📄 Boleto" :
                                          activity.payment_method}
                                    {activity.installments && activity.installments > 1 && ` ${activity.installments}x`}
                                  </span>
                                )}
                                {activity.source && (
                                  <span className="text-xs text-muted-foreground">📍 {activity.source}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), "dd/MM", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), "HH:mm", { locale: ptBR })}
                            </p>
                            <Link
                              to={`/leads/${activity.lead_id}`}
                              className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-1"
                            >
                              Ver perfil
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhuma atividade recente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* AI Insights from Reports */}
            {filteredUnifiedMetrics && (
              <AIReportInsights
                metrics={filteredUnifiedMetrics}
                period={period}
                isLoading={isUnifiedLoading}
              />
            )}

            {/* Inner Tabs for Detailed Reports */}
            {isUnifiedLoading ? (
              <PageSkeleton />
            ) : (
              <Tabs value={activeReportTab} onValueChange={setActiveReportTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                  <TabsTrigger value="geral" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Geral</span>
                  </TabsTrigger>
                  <TabsTrigger value="produtos" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="hidden sm:inline">Produtos</span>
                  </TabsTrigger>
                  <TabsTrigger value="campanhas" className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    <span className="hidden sm:inline">Campanhas</span>
                  </TabsTrigger>
                </TabsList>

                {filteredUnifiedMetrics && (
                  <>
                    <TabsContent value="geral" className="mt-6">
                      <ReportTabGeneral metrics={filteredUnifiedMetrics} />
                    </TabsContent>

                    <TabsContent value="produtos" className="mt-6">
                      <ReportTabProducts metrics={filteredUnifiedMetrics} />
                    </TabsContent>

                    <TabsContent value="campanhas" className="mt-6">
                      <ReportTabCampaigns metrics={filteredUnifiedMetrics} />
                    </TabsContent>
                  </>
                )}
              </Tabs>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
