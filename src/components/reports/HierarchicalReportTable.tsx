import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useToggleFacebookStatus } from "@/hooks/useToggleFacebookStatus";
import {
  FacebookCampaignHierarchical,
  FacebookAdset,
  FacebookAd,
  FacebookMetrics,
} from "@/hooks/useFacebookAdsHierarchicalReports";

interface HierarchicalReportTableProps {
  campaigns: FacebookCampaignHierarchical[];
  totals: FacebookMetrics;
  selectedMetrics: string[];
}

export function HierarchicalReportTable({
  campaigns,
  totals,
  selectedMetrics,
}: HierarchicalReportTableProps) {
  const toggleMutation = useToggleFacebookStatus();

  const formatMetric = (value: number, type: string): string => {
    if (type === "spend" || type === "cpm" || type === "cpc" || type === "costPerConversion") {
      return `R$ ${value.toFixed(2)}`;
    }
    if (type === "ctr" || type === "frequency" || type === "roas") {
      return value.toFixed(2);
    }
    return value.toLocaleString("pt-BR");
  };

  const getMetricLabel = (metricId: string): string => {
    const labels: Record<string, string> = {
      impressions: "Impressões",
      reach: "Alcance",
      clicks: "Cliques",
      spend: "Gasto",
      cpm: "CPM",
      cpc: "CPC",
      ctr: "CTR (%)",
      frequency: "Frequência",
      conversions: "Conversões",
      costPerConversion: "Custo/Conv",
      roas: "ROAS",
    };
    return labels[metricId] || metricId;
  };

  const renderMetrics = (metrics: FacebookMetrics) => {
    return selectedMetrics.map((metricId) => (
      <div key={metricId} className="text-sm text-muted-foreground">
        <span className="font-medium">{getMetricLabel(metricId)}:</span>{" "}
        {formatMetric(metrics[metricId as keyof FacebookMetrics], metricId)}
      </div>
    ));
  };

  return (
    <div className="space-y-2">
      {campaigns.map((campaign) => (
        <CampaignRow
          key={campaign.campaign_id}
          campaign={campaign}
          selectedMetrics={selectedMetrics}
          renderMetrics={renderMetrics}
          toggleMutation={toggleMutation}
        />
      ))}

      {/* Totals Row */}
      <div className="border-t-2 border-border pt-4 mt-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="font-bold text-lg mb-2">📊 TOTAL GERAL</div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {renderMetrics(totals)}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CampaignRowProps {
  campaign: FacebookCampaignHierarchical;
  selectedMetrics: string[];
  renderMetrics: (metrics: FacebookMetrics) => JSX.Element[];
  toggleMutation: ReturnType<typeof useToggleFacebookStatus>;
}

function CampaignRow({ campaign, selectedMetrics, renderMetrics, toggleMutation }: CampaignRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = campaign.status === "ACTIVE";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMutation.mutate({
      entityId: campaign.campaign_id,
      entityType: "campaign",
      newStatus: isActive ? "PAUSED" : "ACTIVE",
      entityName: campaign.campaign_name,
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-border rounded-lg overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="bg-card hover:bg-accent/50 transition-colors p-4 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📊</span>
                  <span className="font-semibold text-base">{campaign.campaign_name}</span>
                  {campaign.objective && (
                    <span className="text-xs text-muted-foreground">
                      • {campaign.objective}
                    </span>
                  )}
                  <div onClick={(e) => e.stopPropagation()} className="ml-auto flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">{isActive ? "Ativo" : "Pausado"}</span>
                    <Switch
                      checked={isActive}
                      disabled={toggleMutation.isPending}
                      onCheckedChange={() => handleToggle({} as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="scale-75"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {renderMetrics(campaign.metrics)}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="bg-muted/30 p-4 space-y-2">
            {campaign.adsets.map((adset) => (
              <AdsetRow
                key={adset.adset_id}
                adset={adset}
                selectedMetrics={selectedMetrics}
                renderMetrics={renderMetrics}
                toggleMutation={toggleMutation}
              />
            ))}
            {campaign.adsets.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-4">
                Nenhum conjunto de anúncios encontrado
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface AdsetRowProps {
  adset: FacebookAdset;
  selectedMetrics: string[];
  renderMetrics: (metrics: FacebookMetrics) => JSX.Element[];
  toggleMutation: ReturnType<typeof useToggleFacebookStatus>;
}

function AdsetRow({ adset, selectedMetrics, renderMetrics, toggleMutation }: AdsetRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = adset.status === "ACTIVE";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <CollapsibleTrigger className="w-full">
          <div className="hover:bg-accent/50 transition-colors p-3 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">📁</span>
                  <span className="font-medium text-sm">{adset.adset_name}</span>
                  {adset.optimization_goal && (
                    <span className="text-xs text-muted-foreground">
                      • {adset.optimization_goal}
                    </span>
                  )}
                  <div onClick={(e) => e.stopPropagation()} className="ml-auto flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">{isActive ? "Ativo" : "Pausado"}</span>
                    <Switch
                      checked={isActive}
                      disabled={toggleMutation.isPending}
                      onCheckedChange={() => {
                        toggleMutation.mutate({
                          entityId: adset.adset_id,
                          entityType: "adset",
                          newStatus: isActive ? "PAUSED" : "ACTIVE",
                          entityName: adset.adset_name,
                        });
                      }}
                      className="scale-75"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {renderMetrics(adset.metrics)}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="bg-muted/20 p-3 space-y-2">
            {adset.ads.map((ad) => (
              <AdRow
                key={ad.ad_id}
                ad={ad}
                selectedMetrics={selectedMetrics}
                renderMetrics={renderMetrics}
                toggleMutation={toggleMutation}
              />
            ))}
            {adset.ads.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-3">
                Nenhum anúncio encontrado
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface AdRowProps {
  ad: FacebookAd;
  selectedMetrics: string[];
  renderMetrics: (metrics: FacebookMetrics) => JSX.Element[];
  toggleMutation: ReturnType<typeof useToggleFacebookStatus>;
}

function AdRow({ ad, selectedMetrics, renderMetrics, toggleMutation }: AdRowProps) {
  const isActive = ad.status === "ACTIVE";

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <span className="text-sm">📢</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm">{ad.ad_name}</span>
              {ad.creative_name && (
                <span className="text-xs text-muted-foreground">• {ad.creative_name}</span>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">{isActive ? "Ativo" : "Pausado"}</span>
                <Switch
                  checked={isActive}
                  disabled={toggleMutation.isPending}
                  onCheckedChange={() => {
                    toggleMutation.mutate({
                      entityId: ad.ad_id,
                      entityType: "ad",
                      newStatus: isActive ? "PAUSED" : "ACTIVE",
                      entityName: ad.ad_name,
                    });
                  }}
                  className="scale-75"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {renderMetrics(ad.metrics)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
