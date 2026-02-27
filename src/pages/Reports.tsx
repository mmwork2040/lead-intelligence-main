import { useState, useEffect, lazy, Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { AIReportInsights } from "@/components/reports/AIReportInsights";
import { ReportTabGeneral } from "@/components/reports/ReportTabGeneral";
import { ReportTabProducts } from "@/components/reports/ReportTabProducts";
import { ReportTabCampaigns } from "@/components/reports/ReportTabCampaigns";
import { useUnifiedReportMetrics } from "@/hooks/useUnifiedReportMetrics";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useProducts } from "@/hooks/useProducts";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { PeriodFilter } from "@/lib/dateUtils";
import { BarChart3, Package, Megaphone, Filter, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const FacebookAdsDashboard = lazy(() => import("@/components/reports/FacebookAdsDashboard"));

const STORAGE_KEY = "reports-period";
const VIEW_STORAGE_KEY = "reports-view";

export interface ReportFilters {
  campaignSlug: string | null;
  productSlug: string | null;
}

const Reports = () => {
  const [topView, setTopView] = useState<string>(() => {
    return localStorage.getItem(VIEW_STORAGE_KEY) || "reports";
  });

  const [period, setPeriod] = useState<PeriodFilter>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
          endDate: parsed.endDate ? new Date(parsed.endDate) : undefined
        };
      } catch {
        return { type: "7d" as const };
      }
    }
    return { type: "7d" as const };
  });

  const [filters, setFilters] = useState<ReportFilters>({
    campaignSlug: null,
    productSlug: null
  });

  const [activeTab, setActiveTab] = useState("geral");

  // Persist period and view to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(period));
  }, [period]);

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, topView);
  }, [topView]);

  const { data: metrics, isLoading } = useUnifiedReportMetrics(period);
  const { data: campaigns } = useCampaigns();
  const { data: products } = useProducts();

  // Filter metrics based on selected filters
  const filteredMetrics = metrics ? {
    ...metrics,
    productMetrics: filters.productSlug
      ? metrics.productMetrics.filter(p => p.productSlug === filters.productSlug)
      : metrics.productMetrics,
    campaignMetrics: filters.campaignSlug
      ? metrics.campaignMetrics.filter(c => c.campaignSlug === filters.campaignSlug)
      : metrics.campaignMetrics,
    sourceMetrics: metrics.sourceMetrics,
    dailyData: metrics.dailyData,
    // Recalculate totals based on filters
    totalLeads: filters.productSlug || filters.campaignSlug
      ? (filters.productSlug
          ? metrics.productMetrics.filter(p => p.productSlug === filters.productSlug).reduce((sum, p) => sum + p.leads, 0)
          : metrics.campaignMetrics.filter(c => c.campaignSlug === filters.campaignSlug).reduce((sum, c) => sum + c.leads, 0))
      : metrics.totalLeads,
    totalSales: filters.productSlug || filters.campaignSlug
      ? (filters.productSlug
          ? metrics.productMetrics.filter(p => p.productSlug === filters.productSlug).reduce((sum, p) => sum + p.sales, 0)
          : metrics.campaignMetrics.filter(c => c.campaignSlug === filters.campaignSlug).reduce((sum, c) => sum + c.sales, 0))
      : metrics.totalSales,
    totalRevenue: filters.productSlug || filters.campaignSlug
      ? (filters.productSlug
          ? metrics.productMetrics.filter(p => p.productSlug === filters.productSlug).reduce((sum, p) => sum + p.revenue, 0)
          : metrics.campaignMetrics.filter(c => c.campaignSlug === filters.campaignSlug).reduce((sum, c) => sum + c.revenue, 0))
      : metrics.totalRevenue,
    totalAdSpend: filters.campaignSlug
      ? metrics.campaignMetrics.filter(c => c.campaignSlug === filters.campaignSlug).reduce((sum, c) => sum + c.investment, 0)
      : metrics.totalAdSpend
  } : null;

  // Recalculate ROAS and conversion rate
  if (filteredMetrics) {
    filteredMetrics.roas = filteredMetrics.totalAdSpend > 0
      ? (filteredMetrics.totalRevenue / filteredMetrics.totalAdSpend).toFixed(2)
      : "0.00";
    filteredMetrics.conversionRate = filteredMetrics.totalLeads > 0
      ? ((filteredMetrics.totalSales / filteredMetrics.totalLeads) * 100).toFixed(1)
      : "0.0";
  }

  const clearFilters = () => {
    setFilters({ campaignSlug: null, productSlug: null });
  };

  const hasActiveFilters = filters.campaignSlug || filters.productSlug;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground text-sm">
              Análise unificada de métricas e tráfego pago
            </p>
          </div>
        </div>

        {/* Top-level view selector */}
        <Tabs value={topView} onValueChange={setTopView}>
          <TabsList>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios Gerais
            </TabsTrigger>
            <TabsTrigger value="traffic" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tráfego Pago
            </TabsTrigger>
          </TabsList>

          {/* General Reports Tab */}
          <TabsContent value="reports" className="mt-6 space-y-6">
            {/* Period & Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <PeriodSelector value={period} onChange={setPeriod} />
            </div>

            <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filtros:
              </div>

              <Select
                value={filters.campaignSlug || "all"}
                onValueChange={(value) => setFilters(f => ({ ...f, campaignSlug: value === "all" ? null : value }))}
              >
                <SelectTrigger className="w-[200px] bg-background">
                  <SelectValue placeholder="Todas as campanhas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as campanhas</SelectItem>
                  {campaigns?.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.slug}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.productSlug || "all"}
                onValueChange={(value) => setFilters(f => ({ ...f, productSlug: value === "all" ? null : value }))}
              >
                <SelectTrigger className="w-[200px] bg-background">
                  <SelectValue placeholder="Todos os produtos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os produtos</SelectItem>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.slug}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>

            {/* AI Insights */}
            {filteredMetrics && (
              <AIReportInsights
                metrics={filteredMetrics}
                period={period}
                isLoading={isLoading}
              />
            )}

            {/* Inner Tabs */}
            {isLoading ? (
              <PageSkeleton />
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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

                {filteredMetrics && (
                  <>
                    <TabsContent value="geral" className="mt-6">
                      <ReportTabGeneral metrics={filteredMetrics} />
                    </TabsContent>

                    <TabsContent value="produtos" className="mt-6">
                      <ReportTabProducts metrics={filteredMetrics} />
                    </TabsContent>

                    <TabsContent value="campanhas" className="mt-6">
                      <ReportTabCampaigns metrics={filteredMetrics} />
                    </TabsContent>
                  </>
                )}
              </Tabs>
            )}
          </TabsContent>

          {/* Traffic Reports Tab */}
          <TabsContent value="traffic" className="mt-6">
            <Suspense fallback={<PageSkeleton />}>
              <FacebookAdsDashboard />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
