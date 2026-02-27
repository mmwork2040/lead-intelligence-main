import { useState } from "react";
import { Eye, EyeOff, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface ChartVisibilityManagerProps {
  visibleCharts: string[];
  onChartsChange: (charts: string[]) => void;
}

const availableCharts = [
  { id: "reach", label: "Alcance ao Longo do Tempo" },
  { id: "spending", label: "Gasto por Campanha" },
  { id: "gauges", label: "Gauges de Performance" },
  { id: "topAds", label: "Top Anúncios" },
  { id: "clicksByCampaign", label: "Cliques por Campanha" },
  { id: "timeline", label: "Timeline de Métricas" },
];

export function ChartVisibilityManager({
  visibleCharts,
  onChartsChange,
}: ChartVisibilityManagerProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (chartId: string) => {
    if (visibleCharts.includes(chartId)) {
      onChartsChange(visibleCharts.filter((id) => id !== chartId));
    } else {
      onChartsChange([...visibleCharts, chartId]);
    }
  };

  const handleShowAll = () => {
    onChartsChange(availableCharts.map((c) => c.id));
  };

  const handleHideAll = () => {
    onChartsChange([]);
  };

  const hiddenCount = availableCharts.length - visibleCharts.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden md:inline">Gráficos</span>
          {hiddenCount > 0 && (
            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
              {visibleCharts.length}/{availableCharts.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Gráficos Visíveis</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleShowAll}
              >
                <Eye className="h-3 w-3" />
                Todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleHideAll}
              >
                <EyeOff className="h-3 w-3" />
                Nenhum
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            {availableCharts.map((chart) => (
              <div
                key={chart.id}
                className="flex items-center space-x-2 py-1"
              >
                <Checkbox
                  id={`chart-${chart.id}`}
                  checked={visibleCharts.includes(chart.id)}
                  onCheckedChange={() => handleToggle(chart.id)}
                />
                <Label
                  htmlFor={`chart-${chart.id}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {chart.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
