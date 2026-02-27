import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Settings,
  BarChart3,
  RefreshCw,
  RotateCcw
} from "lucide-react";
import { Link } from "react-router-dom";
import { useFacebookAdsHierarchicalReports } from "@/hooks/useFacebookAdsHierarchicalReports";
import { useFacebookAdsConfig, useSyncFacebookAds } from "@/hooks/useFacebookAdsConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HierarchicalReportTable } from "@/components/reports/HierarchicalReportTable";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { PeriodFilter } from "@/lib/dateUtils";
import { FacebookSpendingByCampaignChart } from "@/components/reports/FacebookSpendingByCampaignChart";
import { FacebookGaugeChart } from "@/components/reports/FacebookGaugeChart";
import { FacebookTopAdsChart } from "@/components/reports/FacebookTopAdsChart";
import { FacebookClicksByCampaignChart } from "@/components/reports/FacebookClicksByCampaignChart";
import { FacebookReachChart } from "@/components/reports/FacebookReachChart";
import { FacebookAdsFilters } from "@/components/reports/FacebookAdsFilters";
import { FacebookAdsTimelineChart } from "@/components/reports/FacebookAdsTimelineChart";
import { FacebookMetricSelector } from "@/components/reports/FacebookMetricSelector";
import { ViewModeSelector } from "@/components/reports/ViewModeSelector";
import { MetricCardsConfigurator } from "@/components/reports/MetricCardsConfigurator";
import { ChartVisibilityManager } from "@/components/reports/ChartVisibilityManager";
import { TableColumnSelector } from "@/components/reports/TableColumnSelector";
import { FacebookAIInsights } from "@/components/reports/FacebookAIInsights";
import { ActiveFiltersChips } from "@/components/reports/ActiveFiltersChips";
import { MetricCardGrid } from "@/components/reports/MetricCardGrid";
import { FullMetricsTable } from "@/components/reports/FullMetricsTable";
import { CampaignAdBreakdownCards } from "@/components/reports/CampaignAdBreakdownCards";
import { useUserDashboardPreferences } from "@/hooks/useUserDashboardPreferences";
import { toast } from "sonner";

export default function FacebookAdsDashboard() {
  const [period, setPeriod] = useState<PeriodFilter>({ type: "24h" });

  // Filter states
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const [adsetId, setAdsetId] = useState<string | undefined>();
  const [adId, setAdId] = useState<string | undefined>();
  const [status, setStatus] = useState<string>("ACTIVE");

  // Timeline chart metrics
  const [timelineMetrics, setTimelineMetrics] = useState<string[]>(["impressions", "clicks", "conversions"]);

  // User preferences
  const {
    preferences,
    setPreferences,
    resetPreferences,
  } = useUserDashboardPreferences();

  const { data: config } = useFacebookAdsConfig();
  const { mutate: syncFacebookAds, isPending: isSyncing } = useSyncFacebookAds();

  const { data: reportData, isLoading, refetch } = useFacebookAdsHierarchicalReports(period, {
    campaignId,
    adsetId,
    adId,
    status,
  });

  const handleManualSync = () => {
    syncFacebookAds(undefined, {
      onSuccess: () => {
        toast.success("Dados sincronizados com sucesso!");
        refetch();
      },
      onError: (error) => {
        toast.error("Erro ao sincronizar: " + (error as Error).message);
      },
    });
  };

  const handleExportCSV = () => {
    if (!reportData?.campaigns) return;

    const rows: any[] = [];

    reportData.campaigns.forEach((campaign) => {
      rows.push({
        Tipo: "Campanha",
        Nome: campaign.campaign_name,
        Objetivo: campaign.objective || "-",
        ...getMetricsForExport(campaign.metrics, preferences.tableColumns),
      });

      campaign.adsets.forEach((adset) => {
        rows.push({
          Tipo: "Conjunto",
          Nome: `  ${adset.adset_name}`,
          Objetivo: adset.optimization_goal || "-",
          ...getMetricsForExport(adset.metrics, preferences.tableColumns),
        });

        adset.ads.forEach((ad) => {
          rows.push({
            Tipo: "Anúncio",
            Nome: `    ${ad.ad_name}`,
            Objetivo: ad.creative_name || "-",
            ...getMetricsForExport(ad.metrics, preferences.tableColumns),
          });
        });
      });
    });

    if (rows.length === 0) return;

    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-trafego-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getMetricsForExport = (metrics: any, selectedMetrics: string[]) => {
    const result: any = {};
    const labels: Record<string, string> = {
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
    selectedMetrics.forEach((metricId) => {
      result[labels[metricId]] = metrics[metricId]?.toFixed(2) || 0;
    });
    return result;
  };

  const totals = reportData?.totals || {
    impressions: 0,
    reach: 0,
    clicks: 0,
    spend: 0,
    cpm: 0,
    cpc: 0,
    ctr: 0,
    frequency: 0,
    conversions: 0,
    costPerConversion: 0,
    roas: 0,
  };

  const clearFilters = () => {
    setCampaignId(undefined);
    setAdsetId(undefined);
    setAdId(undefined);
    setStatus("ALL");
  };

  const isChartVisible = (chartId: string) => preferences.visibleCharts.includes(chartId);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <ViewModeSelector
            value={preferences.viewMode}
            onChange={(viewMode) => setPreferences({ viewMode })}
          />
          <div className="flex items-center gap-2">
            {config?.is_active && (
              <Badge variant="outline" className="gap-2 bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(160,55%,50%)] dark:bg-[#CCFF00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(160,55%,40%)] dark:bg-[#CCFF00]"></span>
                </span>
                <span className="text-[hsl(160,55%,40%)] dark:text-[#CCFF00]">Conectado</span>
              </Badge>
            )}
            {config?.last_sync_at && (
              <span className="text-xs text-muted-foreground hidden md:inline">
                Sync: {format(new Date(config.last_sync_at), "dd/MM HH:mm", { locale: ptBR })}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleManualSync}
            disabled={isSyncing || !config?.is_active}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">{isSyncing ? "Sincronizando..." : "Sincronizar"}</span>
          </Button>
          <Link to="/integrations">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Configurações</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and Controls Row */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <PeriodSelector value={period} onChange={setPeriod} />
            <FacebookAdsFilters
              campaignId={campaignId}
              adsetId={adsetId}
              adId={adId}
              status={status}
              onCampaignChange={(v) => {
                setCampaignId(v);
                setAdsetId(undefined);
                setAdId(undefined);
              }}
              onAdsetChange={(v) => {
                setAdsetId(v);
                setAdId(undefined);
              }}
              onAdChange={setAdId}
              onStatusChange={setStatus}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <MetricCardsConfigurator
              selectedMetrics={preferences.visibleMetricCards}
              onMetricsChange={(visibleMetricCards) => setPreferences({ visibleMetricCards })}
              onReset={resetPreferences}
            />
            {preferences.viewMode === "dashboard" && (
              <ChartVisibilityManager
                visibleCharts={preferences.visibleCharts}
                onChartsChange={(visibleCharts) => setPreferences({ visibleCharts })}
              />
            )}
            {preferences.viewMode === "table" && (
              <TableColumnSelector
                selectedColumns={preferences.tableColumns}
                onColumnsChange={(tableColumns) => setPreferences({ tableColumns })}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={resetPreferences}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden md:inline">Reset</span>
            </Button>
          </div>
        </div>

        {/* Active Filters Chips */}
        <ActiveFiltersChips
          campaignId={campaignId}
          adsetId={adsetId}
          adId={adId}
          status={status}
          onClearCampaign={() => {
            setCampaignId(undefined);
            setAdsetId(undefined);
            setAdId(undefined);
          }}
          onClearAdset={() => {
            setAdsetId(undefined);
            setAdId(undefined);
          }}
          onClearAd={() => setAdId(undefined)}
          onClearStatus={() => setStatus("ALL")}
          onClearAll={clearFilters}
        />
      </div>

      {/* AI Insights */}
      <FacebookAIInsights
        reportData={reportData!}
        period={period}
        isLoading={isLoading}
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : reportData?.campaigns && reportData.campaigns.length > 0 ? (
        <>
          {/* Cards View Mode */}
          {preferences.viewMode === "cards" && (
            <div className="space-y-6">
              <MetricCardGrid
                totals={totals}
                visibleMetrics={preferences.visibleMetricCards}
                campaignCount={reportData.campaigns.length}
              />
            </div>
          )}

          {/* Table View Mode */}
          {preferences.viewMode === "table" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Relatório Completo</CardTitle>
                  <CardDescription>
                    Todos os dados de campanhas, conjuntos e anúncios
                  </CardDescription>
                </div>
                <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden md:inline">Exportar CSV</span>
                </Button>
              </CardHeader>
              <CardContent>
                <FullMetricsTable
                  campaigns={reportData.campaigns}
                  totals={reportData.totals}
                  selectedColumns={preferences.tableColumns}
                />
              </CardContent>
            </Card>
          )}

          {/* Dashboard View Mode */}
          {preferences.viewMode === "dashboard" && (
            <>
              {/* Metrics Cards */}
              <MetricCardGrid
                totals={totals}
                visibleMetrics={preferences.visibleMetricCards}
                campaignCount={reportData.campaigns.length}
              />

              {/* Individual Breakdown Cards */}
              <CampaignAdBreakdownCards
                campaigns={reportData.campaigns}
                campaignId={campaignId}
                adsetId={adsetId}
                adId={adId}
              />

              {/* Charts Row 1 */}
              {(isChartVisible("reach") || isChartVisible("spending")) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {isChartVisible("reach") && (
                    <div className="lg:col-span-2">
                      <FacebookReachChart period={period} />
                    </div>
                  )}
                  {isChartVisible("spending") && (
                    <div className="space-y-6">
                      <FacebookSpendingByCampaignChart campaigns={reportData.campaigns} />
                    </div>
                  )}
                </div>
              )}

              {/* Charts Row 2 - Gauges + Top Ads */}
              {(isChartVisible("gauges") || isChartVisible("topAds")) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {isChartVisible("gauges") && (
                    <>
                      <FacebookGaugeChart
                        title="Taxa de Conversão"
                        value={totals.conversions > 0 && totals.clicks > 0
                          ? (totals.conversions / totals.clicks) * 100
                          : 0}
                        maxValue={20}
                        trend={-22.5}
                      />
                      <FacebookGaugeChart
                        title="CTR"
                        value={totals.ctr}
                        maxValue={5}
                        trend={22.5}
                      />
                    </>
                  )}
                  {isChartVisible("topAds") && (
                    <>
                      <FacebookTopAdsChart campaigns={reportData.campaigns} type="spend" />
                      <FacebookTopAdsChart campaigns={reportData.campaigns} type="conversions" />
                    </>
                  )}
                </div>
              )}

              {/* Charts Row 3 - Clicks by Campaign */}
              {isChartVisible("clicksByCampaign") && (
                <FacebookClicksByCampaignChart campaigns={reportData.campaigns} />
              )}

              {/* Timeline Chart */}
              {isChartVisible("timeline") && (
                <div className="space-y-4">
                  <FacebookMetricSelector
                    selectedMetrics={timelineMetrics}
                    onMetricsChange={setTimelineMetrics}
                  />
                  <FacebookAdsTimelineChart
                    selectedMetrics={timelineMetrics}
                    period={period}
                  />
                </div>
              )}

              {/* Hierarchical Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Relatório Detalhado</CardTitle>
                    <CardDescription>
                      Campanhas &bull; Conjuntos &bull; Anúncios
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <TableColumnSelector
                      selectedColumns={preferences.tableColumns}
                      onColumnsChange={(tableColumns) => setPreferences({ tableColumns })}
                    />
                    <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      <span className="hidden md:inline">Exportar CSV</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <HierarchicalReportTable
                    campaigns={reportData.campaigns}
                    totals={reportData.totals}
                    selectedMetrics={preferences.tableColumns}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Configurar Integração</CardTitle>
            <CardDescription>
              Configure a integração com Facebook Ads para visualizar os relatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-center text-muted-foreground mb-4">
              Para visualizar os relatórios de tráfego, você precisa:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-6">
              <li>Configurar o Access Token e Ad Account ID</li>
              <li>Sincronizar as campanhas com o Facebook</li>
            </ol>
            <Link to="/integrations">
              <Button className="gap-2">
                <Settings className="h-4 w-4" />
                Ir para Integrações
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
