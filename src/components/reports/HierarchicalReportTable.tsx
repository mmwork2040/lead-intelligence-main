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
import { useUpdateFacebookBudget } from "@/hooks/useUpdateFacebookBudget";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, Check, Loader2 } from "lucide-react";
import {
  FacebookCampaignHierarchical,
  FacebookAdset,
  FacebookAd,
  FacebookMetrics,
} from "@/hooks/useFacebookAdsHierarchicalReports";

function BudgetEditor({
  entityId,
  entityType,
  entityName,
  dailyBudget,
}: {
  entityId: string;
  entityType: "campaign" | "adset";
  entityName: string;
  dailyBudget: number | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState((dailyBudget || 0) / 100);
  const updateMutation = useUpdateFacebookBudget();

  const handleSave = () => {
    updateMutation.mutate(
      {
        entityId,
        entityType,
        newBudget: value * 100, // envia em centavos para Facebook API
        entityName,
      },
      {
        onSuccess: () => setIsOpen(false),
      }
    );
  };

  return (
    <div className="flex items-center ml-2 border-l border-border pl-2" onClick={(e) => e.stopPropagation()}>
      <span className="text-xs text-muted-foreground mr-1">
        Orçamento: {dailyBudget ? `R$ ${(dailyBudget / 100).toFixed(2)} / dia` : "Não def."}
      </span>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-5 w-5 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground">
            <Edit2 className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3 z-50 shadow-sh-2 glass-high border-border" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Editar Orçamento</h4>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
              <Input
                type="number"
                min="0"
                step="1"
                className="pl-8 !bg-[var(--glass-input)] h-9 text-sm"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="h-8 shadow-glow-acid">
                {updateMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

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
                  <BudgetEditor
                    entityId={campaign.campaign_id}
                    entityType="campaign"
                    entityName={campaign.campaign_name}
                    dailyBudget={campaign.daily_budget}
                  />
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
                  <BudgetEditor
                    entityId={adset.adset_id}
                    entityType="adset"
                    entityName={adset.adset_name}
                    dailyBudget={adset.daily_budget}
                  />
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
