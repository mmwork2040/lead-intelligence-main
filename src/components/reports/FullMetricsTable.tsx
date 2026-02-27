import { useState } from "react";
import { ChevronDown, ChevronRight, Search, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FacebookCampaignHierarchical, FacebookMetrics } from "@/hooks/useFacebookAdsHierarchicalReports";

interface FullMetricsTableProps {
  campaigns: FacebookCampaignHierarchical[];
  totals: FacebookMetrics;
  selectedColumns: string[];
}

const columnLabels: Record<string, string> = {
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

const formatValue = (key: string, value: number | null | undefined): string => {
  if (value === null || value === undefined) return "-";
  
  if (["spend", "cpc", "cpm", "costPerConversion"].includes(key)) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  }
  
  if (key === "ctr") {
    return `${value.toFixed(2)}%`;
  }
  
  if (key === "roas") {
    return value.toFixed(2);
  }
  
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
};

export function FullMetricsTable({
  campaigns,
  totals,
  selectedColumns,
}: FullMetricsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdsets, setExpandedAdsets] = useState<Set<string>>(new Set());

  const filteredCampaigns = campaigns.filter((campaign) => {
    const searchLower = searchTerm.toLowerCase();
    if (campaign.campaign_name.toLowerCase().includes(searchLower)) return true;
    
    return campaign.adsets.some((adset) => {
      if (adset.adset_name.toLowerCase().includes(searchLower)) return true;
      return adset.ads.some((ad) => ad.ad_name.toLowerCase().includes(searchLower));
    });
  });

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAdset = (id: string) => {
    setExpandedAdsets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allCampaigns = new Set(campaigns.map((c) => c.campaign_id));
    const allAdsets = new Set(
      campaigns.flatMap((c) => c.adsets.map((a) => a.adset_id))
    );
    setExpandedCampaigns(allCampaigns);
    setExpandedAdsets(allAdsets);
  };

  const collapseAll = () => {
    setExpandedCampaigns(new Set());
    setExpandedAdsets(new Set());
  };

  const allExpanded =
    expandedCampaigns.size === campaigns.length &&
    expandedAdsets.size === campaigns.flatMap((c) => c.adsets).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campanhas, conjuntos ou anúncios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={allExpanded ? collapseAll : expandAll}
        >
          {allExpanded ? (
            <>
              <ChevronsDownUp className="h-4 w-4" />
              <span className="hidden md:inline">Recolher</span>
            </>
          ) : (
            <>
              <ChevronsUpDown className="h-4 w-4" />
              <span className="hidden md:inline">Expandir</span>
            </>
          )}
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground sticky left-0 bg-muted/50 min-w-[250px]">
                  Nome
                </th>
                {selectedColumns.map((col) => (
                  <th
                    key={col}
                    className="text-right py-3 px-4 font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {columnLabels[col]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCampaigns.map((campaign) => (
                <>
                  {/* Campaign Row */}
                  <tr
                    key={campaign.campaign_id}
                    className="bg-background hover:bg-muted/30 cursor-pointer"
                    onClick={() => toggleCampaign(campaign.campaign_id)}
                  >
                    <td className="py-3 px-4 sticky left-0 bg-inherit">
                      <div className="flex items-center gap-2">
                        {expandedCampaigns.has(campaign.campaign_id) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{campaign.campaign_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {campaign.objective || "Campanha"}
                        </Badge>
                      </div>
                    </td>
                    {selectedColumns.map((col) => (
                      <td key={col} className="py-3 px-4 text-right font-medium">
                        {formatValue(col, campaign.metrics[col as keyof FacebookMetrics] as number)}
                      </td>
                    ))}
                  </tr>

                  {/* Adsets */}
                  {expandedCampaigns.has(campaign.campaign_id) &&
                    campaign.adsets.map((adset) => (
                      <>
                        <tr
                          key={adset.adset_id}
                          className="bg-muted/20 hover:bg-muted/40 cursor-pointer"
                          onClick={() => toggleAdset(adset.adset_id)}
                        >
                          <td className="py-2.5 px-4 pl-10 sticky left-0 bg-inherit">
                            <div className="flex items-center gap-2">
                              {expandedAdsets.has(adset.adset_id) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-muted-foreground">{adset.adset_name}</span>
                              {adset.optimization_goal && (
                                <Badge variant="secondary" className="text-xs">
                                  {adset.optimization_goal}
                                </Badge>
                              )}
                            </div>
                          </td>
                          {selectedColumns.map((col) => (
                            <td key={col} className="py-2.5 px-4 text-right text-muted-foreground">
                              {formatValue(col, adset.metrics[col as keyof FacebookMetrics] as number)}
                            </td>
                          ))}
                        </tr>

                        {/* Ads */}
                        {expandedAdsets.has(adset.adset_id) &&
                          adset.ads.map((ad) => (
                            <tr
                              key={ad.ad_id}
                              className="bg-muted/10 hover:bg-muted/30"
                            >
                              <td className="py-2 px-4 pl-16 sticky left-0 bg-inherit">
                                <span className="text-muted-foreground text-xs">
                                  {ad.ad_name}
                                </span>
                              </td>
                              {selectedColumns.map((col) => (
                                <td
                                  key={col}
                                  className="py-2 px-4 text-right text-muted-foreground text-xs"
                                >
                                  {formatValue(col, ad.metrics[col as keyof FacebookMetrics] as number)}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </>
                    ))}
                </>
              ))}

              {/* Totals Row */}
              <tr className="bg-primary/5 font-semibold border-t-2 border-primary/20">
                <td className="py-3 px-4 sticky left-0 bg-primary/5">
                  TOTAL GERAL
                </td>
                {selectedColumns.map((col) => (
                  <td key={col} className="py-3 px-4 text-right">
                    {formatValue(col, totals[col as keyof FacebookMetrics] as number)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
