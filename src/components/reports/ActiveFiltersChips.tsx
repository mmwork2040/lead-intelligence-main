import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ActiveFiltersChipsProps {
  campaignId?: string;
  campaignName?: string;
  adsetId?: string;
  adsetName?: string;
  adId?: string;
  adName?: string;
  status?: string;
  onClearCampaign: () => void;
  onClearAdset: () => void;
  onClearAd: () => void;
  onClearStatus: () => void;
  onClearAll: () => void;
}

export function ActiveFiltersChips({
  campaignId,
  campaignName,
  adsetId,
  adsetName,
  adId,
  adName,
  status,
  onClearCampaign,
  onClearAdset,
  onClearAd,
  onClearStatus,
  onClearAll,
}: ActiveFiltersChipsProps) {
  const hasFilters = campaignId || adsetId || adId || (status && status !== "all");

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Filtros:</span>
      
      {status && status !== "all" && (
        <Badge variant="secondary" className="gap-1 pr-1">
          Status: {status}
          <button
            onClick={onClearStatus}
            className="ml-1 rounded-full hover:bg-muted p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {campaignId && (
        <Badge variant="secondary" className="gap-1 pr-1">
          Campanha: {campaignName || campaignId.slice(0, 8)}...
          <button
            onClick={onClearCampaign}
            className="ml-1 rounded-full hover:bg-muted p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {adsetId && (
        <Badge variant="secondary" className="gap-1 pr-1">
          Conjunto: {adsetName || adsetId.slice(0, 8)}...
          <button
            onClick={onClearAdset}
            className="ml-1 rounded-full hover:bg-muted p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {adId && (
        <Badge variant="secondary" className="gap-1 pr-1">
          Anúncio: {adName || adId.slice(0, 8)}...
          <button
            onClick={onClearAd}
            className="ml-1 rounded-full hover:bg-muted p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs text-muted-foreground hover:text-foreground"
        onClick={onClearAll}
      >
        Limpar todos
      </Button>
    </div>
  );
}
