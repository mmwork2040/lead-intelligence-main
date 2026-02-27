import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFacebookCampaigns } from "@/hooks/useFacebookCampaigns";
import { useFacebookAdsets } from "@/hooks/useFacebookAdsets";
import { useFacebookAds } from "@/hooks/useFacebookAds";

interface FacebookAdsFiltersProps {
  campaignId: string | undefined;
  adsetId: string | undefined;
  adId: string | undefined;
  status: string;
  onCampaignChange: (value: string | undefined) => void;
  onAdsetChange: (value: string | undefined) => void;
  onAdChange: (value: string | undefined) => void;
  onStatusChange: (value: string) => void;
}

export function FacebookAdsFilters({
  campaignId,
  adsetId,
  adId,
  status,
  onCampaignChange,
  onAdsetChange,
  onAdChange,
  onStatusChange,
}: FacebookAdsFiltersProps) {
  const { data: campaigns } = useFacebookCampaigns();
  const { data: adsets } = useFacebookAdsets(campaignId);
  const { data: ads } = useFacebookAds(adsetId);

  // Clear adset and ad when campaign changes
  useEffect(() => {
    if (campaignId === undefined) {
      onAdsetChange(undefined);
      onAdChange(undefined);
    }
  }, [campaignId]);

  // Clear ad when adset changes
  useEffect(() => {
    if (adsetId === undefined) {
      onAdChange(undefined);
    }
  }, [adsetId]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status Filter */}
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[130px] h-9 bg-background">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          <SelectItem value="ALL">Todos</SelectItem>
          <SelectItem value="ACTIVE">Ativos</SelectItem>
          <SelectItem value="PAUSED">Pausados</SelectItem>
        </SelectContent>
      </Select>

      {/* Campaign Filter */}
      <Select
        value={campaignId || "ALL"}
        onValueChange={(v) => onCampaignChange(v === "ALL" ? undefined : v)}
      >
        <SelectTrigger className="w-[200px] h-9 bg-background">
          <SelectValue placeholder="Campanha" />
        </SelectTrigger>
        <SelectContent className="bg-popover max-h-[300px]">
          <SelectItem value="ALL">Todas Campanhas</SelectItem>
          {campaigns?.map((c) => (
            <SelectItem key={c.fb_campaign_id} value={c.fb_campaign_id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Adset Filter */}
      <Select
        value={adsetId || "ALL"}
        onValueChange={(v) => onAdsetChange(v === "ALL" ? undefined : v)}
        disabled={!campaignId}
      >
        <SelectTrigger className="w-[200px] h-9 bg-background">
          <SelectValue placeholder="Conjunto" />
        </SelectTrigger>
        <SelectContent className="bg-popover max-h-[300px]">
          <SelectItem value="ALL">Todos Conjuntos</SelectItem>
          {adsets?.map((a) => (
            <SelectItem key={a.fb_adset_id} value={a.fb_adset_id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Ad Filter */}
      <Select
        value={adId || "ALL"}
        onValueChange={(v) => onAdChange(v === "ALL" ? undefined : v)}
        disabled={!adsetId}
      >
        <SelectTrigger className="w-[200px] h-9 bg-background">
          <SelectValue placeholder="Anúncio" />
        </SelectTrigger>
        <SelectContent className="bg-popover max-h-[300px]">
          <SelectItem value="ALL">Todos Anúncios</SelectItem>
          {ads?.map((a) => (
            <SelectItem key={a.fb_ad_id} value={a.fb_ad_id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
