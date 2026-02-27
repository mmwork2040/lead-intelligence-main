import { useState } from "react";
import { Calendar, X, Filter, ChevronDown, ChevronUp, MapPin, Target, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useProducts } from "@/hooks/useProducts";
import { useTags } from "@/hooks/useTags";
import { useCampaigns } from "@/hooks/useCampaigns";
import { sourceLabels, brazilianStates, crmStatusOptions } from "@/lib/translations";
import { PeriodType, calculateDateRange } from "@/lib/dateUtils";
import { LeadsFilters } from "@/hooks/useLeads";

interface LeadFiltersProps {
  filters: LeadsFilters;
  onChange: (filters: LeadsFilters) => void;
  resultCount?: number;
}

const periods: { type: PeriodType; label: string }[] = [
  { type: "today", label: "Hoje" },
  { type: "7d", label: "Últimos 7 dias" },
  { type: "15d", label: "Últimos 15 dias" },
  { type: "30d", label: "Últimos 30 dias" },
  { type: "3m", label: "Últimos 3 meses" },
  { type: "6m", label: "Últimos 6 meses" },
  { type: "1y", label: "Último ano" },
  { type: "all", label: "Todo o período" },
];

export const LeadFilters = ({ filters, onChange, resultCount }: LeadFiltersProps) => {
  const { data: products } = useProducts();
  const { data: tags } = useTags();
  const { data: campaigns } = useCampaigns();
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const { startDate, endDate } = calculateDateRange(filters.period);

  // Contagem de filtros básicos
  const basicFiltersCount = [
    filters.source,
    filters.productSlug,
    filters.tagIds && filters.tagIds.length > 0,
  ].filter(Boolean).length;

  // Contagem de filtros avançados
  const advancedFiltersCount = [
    filters.crmStatus,
    filters.state,
    filters.city,
    filters.utmSource,
    filters.utmCampaign,
    filters.projectSlug,
    filters.hasPurchase,
    filters.noPurchase,
  ].filter(Boolean).length;

  const totalFiltersCount = basicFiltersCount + advancedFiltersCount;

  const handleClearFilters = () => {
    onChange({
      search: filters.search,
      period: { type: "all" },
      source: undefined,
      productSlug: undefined,
      tagIds: [],
      // Clear advanced filters
      crmStatus: undefined,
      state: undefined,
      city: undefined,
      utmSource: undefined,
      utmCampaign: undefined,
      projectSlug: undefined,
      hasPurchase: undefined,
      noPurchase: undefined,
    });
  };

  const handleTagToggle = (tagId: string) => {
    const currentTags = filters.tagIds || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    onChange({ ...filters, tagIds: newTags });
  };

  const currentPeriodLabel = periods.find((p) => p.type === filters.period.type)?.label || "Selecione";

  return (
    <div className="space-y-4">
      {/* Basic Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period Selector */}
        <Select
          value={filters.period.type}
          onValueChange={(type) => onChange({ ...filters, period: { type: type as PeriodType } })}
        >
          <SelectTrigger className="w-[180px] h-9">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Período">{currentPeriodLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period.type} value={period.type}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.productSlug || "all"}
          onValueChange={(value) => onChange({ ...filters, productSlug: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Produto" />
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

        <Select
          value={filters.source || "all"}
          onValueChange={(value) => onChange({ ...filters, source: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {Object.entries(sourceLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tags Multi-Select */}
        <Popover open={tagsPopoverOpen} onOpenChange={setTagsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 gap-2 min-w-[120px] justify-start">
              <Filter className="h-4 w-4" />
              Tags
              {filters.tagIds && filters.tagIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {filters.tagIds.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-2" align="start">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {tags && tags.length > 0 ? (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    <Checkbox
                      checked={filters.tagIds?.includes(tag.id)}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                    />
                    <Badge
                      variant="outline"
                      style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
                    >
                      {tag.name}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma tag cadastrada
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {totalFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1 text-muted-foreground"
            onClick={handleClearFilters}
          >
            <X className="h-4 w-4" />
            Limpar todos ({totalFiltersCount})
          </Button>
        )}
      </div>

      {/* Advanced Filters Collapsible */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Filtros Avançados
            {advancedFiltersCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {advancedFiltersCount}
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CRM Status */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                Status CRM
              </Label>
              <Select
                value={filters.crmStatus || "all"}
                onValueChange={(value) => onChange({ ...filters, crmStatus: value === "all" ? undefined : value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {crmStatusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Estado
              </Label>
              <Select
                value={filters.state || "all"}
                onValueChange={(value) => onChange({ ...filters, state: value === "all" ? undefined : value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {brazilianStates.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Cidade
              </Label>
              <Input
                placeholder="Buscar cidade..."
                value={filters.city || ""}
                onChange={(e) => onChange({ ...filters, city: e.target.value || undefined })}
                className="h-9"
              />
            </div>

            {/* Campaign/Project */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                Campanha
              </Label>
              <Select
                value={filters.projectSlug || "all"}
                onValueChange={(value) => onChange({ ...filters, projectSlug: value === "all" ? undefined : value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas" />
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
            </div>

            {/* UTM Source */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">UTM Source</Label>
              <Input
                placeholder="Ex: facebook, google..."
                value={filters.utmSource || ""}
                onChange={(e) => onChange({ ...filters, utmSource: e.target.value || undefined })}
                className="h-9"
              />
            </div>

            {/* UTM Campaign */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">UTM Campaign</Label>
              <Input
                placeholder="Ex: lancamento-2024..."
                value={filters.utmCampaign || ""}
                onChange={(e) => onChange({ ...filters, utmCampaign: e.target.value || undefined })}
                className="h-9"
              />
            </div>

            {/* Purchase Filters */}
            <div className="space-y-3 sm:col-span-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <ShoppingCart className="h-3 w-3" />
                Filtro de Compras
              </Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hasPurchase"
                    checked={filters.hasPurchase || false}
                    onCheckedChange={(checked) => 
                      onChange({ 
                        ...filters, 
                        hasPurchase: checked ? true : undefined,
                        noPurchase: checked ? undefined : filters.noPurchase 
                      })
                    }
                  />
                  <Label htmlFor="hasPurchase" className="text-sm cursor-pointer">
                    Com compras
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="noPurchase"
                    checked={filters.noPurchase || false}
                    onCheckedChange={(checked) => 
                      onChange({ 
                        ...filters, 
                        noPurchase: checked ? true : undefined,
                        hasPurchase: checked ? undefined : filters.hasPurchase 
                      })
                    }
                  />
                  <Label htmlFor="noPurchase" className="text-sm cursor-pointer">
                    Sem compras
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Info Bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            {format(startDate, "dd/MM/yyyy", { locale: ptBR })} -{" "}
            {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
        {resultCount !== undefined && (
          <span className="font-medium">
            {resultCount} {resultCount === 1 ? "lead encontrado" : "leads encontrados"}
          </span>
        )}
      </div>
    </div>
  );
};
