import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Eye, MousePointerClick, DollarSign, Target, BarChart3, TrendingUp } from "lucide-react";
import { useToggleFacebookStatus } from "@/hooks/useToggleFacebookStatus";
import type {
  FacebookCampaignHierarchical,
  FacebookMetrics,
} from "@/hooks/useFacebookAdsHierarchicalReports";

interface BreakdownItem {
  id: string;
  name: string;
  status: string | null;
  metrics: FacebookMetrics;
  entityType: "campaign" | "adset" | "ad";
}

interface CampaignAdBreakdownCardsProps {
  campaigns: FacebookCampaignHierarchical[];
  campaignId?: string;
  adsetId?: string;
  adId?: string;
}

function getBreakdownData(
  campaigns: FacebookCampaignHierarchical[],
  campaignId?: string,
  adsetId?: string,
  adId?: string
): { title: string; subtitle: string; items: BreakdownItem[] } {
  if (adId) {
    for (const c of campaigns) {
      for (const as of c.adsets) {
        const ad = as.ads.find((a) => a.ad_id === adId);
        if (ad) {
          return {
            title: `Anúncio: ${ad.ad_name}`,
            subtitle: `Detalhes do anúncio selecionado`,
            items: [{ id: ad.ad_id, name: ad.ad_name, status: ad.status, metrics: ad.metrics, entityType: "ad" }],
          };
        }
      }
    }
    return { title: "Anúncio", subtitle: "", items: [] };
  }

  if (adsetId) {
    for (const c of campaigns) {
      const adset = c.adsets.find((a) => a.adset_id === adsetId);
      if (adset) {
        return {
          title: `Anúncios de "${adset.adset_name}"`,
          subtitle: `${adset.ads.length} anúncio(s) neste conjunto`,
          items: adset.ads.map((ad) => ({
            id: ad.ad_id,
            name: ad.ad_name,
            status: ad.status,
            metrics: ad.metrics,
            entityType: "ad" as const,
          })),
        };
      }
    }
    return { title: "Anúncios", subtitle: "", items: [] };
  }

  if (campaignId) {
    const campaign = campaigns.find((c) => c.campaign_id === campaignId);
    if (campaign) {
      return {
        title: `Conjuntos de "${campaign.campaign_name}"`,
        subtitle: `${campaign.adsets.length} conjunto(s) nesta campanha`,
        items: campaign.adsets.map((as) => ({
          id: as.adset_id,
          name: as.adset_name,
          status: as.status,
          metrics: as.metrics,
          entityType: "adset" as const,
        })),
      };
    }
    return { title: "Conjuntos", subtitle: "", items: [] };
  }

  return {
    title: "Detalhamento por Campanha",
    subtitle: `${campaigns.length} campanha(s) ativa(s)`,
    items: campaigns.map((c) => ({
      id: c.campaign_id,
      name: c.campaign_name,
      status: c.status,
      metrics: c.metrics,
      entityType: "campaign" as const,
    })),
  };
}

const fmt = (v: number, type: "number" | "currency" | "percent") => {
  if (type === "currency") {
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}K`;
    return `R$ ${v.toFixed(2)}`;
  }
  if (type === "percent") return `${v.toFixed(2)}%`;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
};

const metricsDef = [
  { key: "impressions" as const, label: "Impressões", icon: Eye, type: "number" as const },
  { key: "clicks" as const, label: "Cliques", icon: MousePointerClick, type: "number" as const },
  { key: "spend" as const, label: "Gasto", icon: DollarSign, type: "currency" as const },
  { key: "conversions" as const, label: "Conversões", icon: Target, type: "number" as const },
  { key: "ctr" as const, label: "CTR", icon: BarChart3, type: "percent" as const },
  { key: "cpc" as const, label: "CPC", icon: TrendingUp, type: "currency" as const },
];

function BreakdownCard({ item, onToggle, isToggling }: { item: BreakdownItem; onToggle: (item: BreakdownItem) => void; isToggling: boolean }) {
  const isActive = item.status === "ACTIVE";

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-soft hover:shadow-md transition-shadow space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-sm text-foreground truncate flex-1">{item.name}</h4>
        <div className="flex items-center gap-2 shrink-0">
          {item.status && (
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="text-[10px]"
            >
              {isActive ? "Ativo" : "Pausado"}
            </Badge>
          )}
          <Switch
            checked={isActive}
            disabled={isToggling}
            onCheckedChange={() => onToggle(item)}
            className="scale-75"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {metricsDef.map((m) => (
          <div key={m.key} className="space-y-0.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <m.icon className="h-3 w-3" />
              <span className="text-[10px]">{m.label}</span>
            </div>
            <p className="text-sm font-bold text-foreground">
              {fmt(item.metrics[m.key], m.type)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CampaignAdBreakdownCards({
  campaigns,
  campaignId,
  adsetId,
  adId,
}: CampaignAdBreakdownCardsProps) {
  const { title, subtitle, items } = useMemo(
    () => getBreakdownData(campaigns, campaignId, adsetId, adId),
    [campaigns, campaignId, adsetId, adId]
  );

  const { mutate: toggleStatus, isPending } = useToggleFacebookStatus();

  const handleToggle = (item: BreakdownItem) => {
    const newStatus = item.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    toggleStatus({
      entityId: item.id,
      entityType: item.entityType,
      newStatus,
      entityName: item.name,
    });
  };

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <BreakdownCard key={item.id} item={item} onToggle={handleToggle} isToggling={isPending} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
