import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useProducts } from "@/hooks/useProducts";

interface ReportFiltersProps {
  filters: {
    startDate: string;
    endDate: string;
    campaignId?: string;
    productSlug?: string;
    source?: string;
  };
  onFiltersChange: (filters: any) => void;
  onApply: () => void;
}

export function ReportFilters({ filters, onFiltersChange, onApply }: ReportFiltersProps) {
  const { data: campaigns } = useCampaigns();
  const { data: products } = useProducts();

  const sources = [
    { value: "manual", label: "Manual" },
    { value: "import", label: "Importação" },
    { value: "hotmart", label: "Hotmart" },
    { value: "facebook_ads", label: "Facebook Ads" },
    { value: "organic", label: "Orgânico" },
    { value: "whatsapp", label: "WhatsApp" },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium mb-3">Filtros</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data Inicial</Label>
          <Input
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Data Final</Label>
          <Input
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign">Campanha</Label>
          <Select
            value={filters.campaignId || "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, campaignId: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger id="campaign">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {campaigns?.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.slug}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product">Produto</Label>
          <Select
            value={filters.productSlug || "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, productSlug: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger id="product">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {products?.map((product) => (
                <SelectItem key={product.id} value={product.slug}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Origem</Label>
          <Select
            value={filters.source || "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, source: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger id="source">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        <Button onClick={onApply} className="w-full md:w-auto">
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
