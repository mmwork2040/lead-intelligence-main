import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface FacebookReportFiltersProps {
  filters: {
    startDate: string;
    endDate: string;
    campaignId?: string;
    adsetId?: string;
    adId?: string;
    status?: string;
  };
  onFiltersChange: (filters: any) => void;
  onApply: () => void;
}

export function FacebookReportFilters({
  filters,
  onFiltersChange,
  onApply,
}: FacebookReportFiltersProps) {
  const { data: campaigns, isLoading: loadingCampaigns } = useFacebookCampaigns();
  const { data: adsets } = useFacebookAdsets(filters.campaignId);
  const { data: ads } = useFacebookAds(filters.adsetId);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-sm font-medium mb-4">Filtros</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data Inicial</Label>
          <Input
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              onFiltersChange({ ...filters, startDate: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Data Final</Label>
          <Input
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              onFiltersChange({ ...filters, endDate: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status || "ALL"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, status: value })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ACTIVE">Ativos</SelectItem>
              <SelectItem value="PAUSED">Pausados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign">Campanha</Label>
          <Select
            value={filters.campaignId || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                campaignId: value === "all" ? undefined : value,
                adsetId: undefined,
                adId: undefined,
              })
            }
            disabled={loadingCampaigns}
          >
            <SelectTrigger id="campaign">
              <SelectValue placeholder="Todas as campanhas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as campanhas</SelectItem>
              {campaigns?.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.fb_campaign_id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adset">Conjunto de Anúncios</Label>
          <Select
            value={filters.adsetId || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                adsetId: value === "all" ? undefined : value,
                adId: undefined,
              })
            }
            disabled={!filters.campaignId}
          >
            <SelectTrigger id="adset">
              <SelectValue placeholder="Todos os conjuntos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os conjuntos</SelectItem>
              {adsets?.map((adset) => (
                <SelectItem key={adset.id} value={adset.fb_adset_id}>
                  {adset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ad">Anúncio</Label>
          <Select
            value={filters.adId || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                adId: value === "all" ? undefined : value,
              })
            }
            disabled={!filters.adsetId}
          >
            <SelectTrigger id="ad">
              <SelectValue placeholder="Todos os anúncios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os anúncios</SelectItem>
              {ads?.map((ad) => (
                <SelectItem key={ad.id} value={ad.fb_ad_id}>
                  {ad.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        <Button onClick={onApply}>Aplicar Filtros</Button>
      </div>
    </div>
  );
}
