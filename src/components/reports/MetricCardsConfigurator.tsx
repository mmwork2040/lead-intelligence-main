import { useState } from "react";
import { Settings2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface MetricCardsConfiguratorProps {
  selectedMetrics: string[];
  onMetricsChange: (metrics: string[]) => void;
  onReset: () => void;
}

const availableMetrics = [
  { id: "conversions", label: "Conversões", category: "performance" },
  { id: "impressions", label: "Impressões", category: "reach" },
  { id: "reach", label: "Alcance", category: "reach" },
  { id: "clicks", label: "Cliques", category: "engagement" },
  { id: "spend", label: "Gasto Total", category: "cost" },
  { id: "cpc", label: "CPC", category: "cost" },
  { id: "frequency", label: "Frequência", category: "reach" },
  { id: "cpm", label: "CPM", category: "cost" },
  { id: "costPerConversion", label: "Custo/Conv", category: "cost" },
  { id: "ctr", label: "CTR", category: "engagement" },
  { id: "roas", label: "ROAS", category: "performance" },
  { id: "campaigns", label: "Campanhas", category: "general" },
];

const categories = [
  { id: "performance", label: "Performance" },
  { id: "reach", label: "Alcance" },
  { id: "engagement", label: "Engajamento" },
  { id: "cost", label: "Custos" },
  { id: "general", label: "Geral" },
];

export function MetricCardsConfigurator({
  selectedMetrics,
  onMetricsChange,
  onReset,
}: MetricCardsConfiguratorProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      onMetricsChange(selectedMetrics.filter((id) => id !== metricId));
    } else {
      onMetricsChange([...selectedMetrics, metricId]);
    }
  };

  const handleSelectAll = () => {
    onMetricsChange(availableMetrics.map((m) => m.id));
  };

  const handleClearAll = () => {
    onMetricsChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          <span className="hidden md:inline">Personalizar Cards</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Métricas Visíveis</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleSelectAll}
              >
                Todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleClearAll}
              >
                Nenhuma
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {categories.map((category) => {
              const categoryMetrics = availableMetrics.filter(
                (m) => m.category === category.id
              );
              if (categoryMetrics.length === 0) return null;

              return (
                <div key={category.id} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {category.label}
                  </p>
                  <div className="space-y-1">
                    {categoryMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="flex items-center space-x-2 py-1"
                      >
                        <Checkbox
                          id={`config-${metric.id}`}
                          checked={selectedMetrics.includes(metric.id)}
                          onCheckedChange={() => handleToggle(metric.id)}
                        />
                        <Label
                          htmlFor={`config-${metric.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {metric.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2"
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
