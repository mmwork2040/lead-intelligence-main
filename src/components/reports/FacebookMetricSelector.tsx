import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FacebookMetricSelectorProps {
  selectedMetrics: string[];
  onMetricsChange: (metrics: string[]) => void;
}

const availableMetrics = [
  { id: "impressions", label: "Impressões" },
  { id: "reach", label: "Alcance" },
  { id: "clicks", label: "Cliques" },
  { id: "spend", label: "Gasto" },
  { id: "cpm", label: "CPM" },
  { id: "cpc", label: "CPC" },
  { id: "ctr", label: "CTR" },
  { id: "frequency", label: "Frequência" },
  { id: "conversions", label: "Conversões" },
  { id: "costPerConversion", label: "Custo/Conversão" },
  { id: "roas", label: "ROAS" },
];

export function FacebookMetricSelector({
  selectedMetrics,
  onMetricsChange,
}: FacebookMetricSelectorProps) {
  const handleToggle = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      onMetricsChange(selectedMetrics.filter((id) => id !== metricId));
    } else {
      onMetricsChange([...selectedMetrics, metricId]);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium mb-3">Métricas Disponíveis</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {availableMetrics.map((metric) => (
          <div key={metric.id} className="flex items-center space-x-2">
            <Checkbox
              id={metric.id}
              checked={selectedMetrics.includes(metric.id)}
              onCheckedChange={() => handleToggle(metric.id)}
            />
            <Label
              htmlFor={metric.id}
              className="text-sm font-normal cursor-pointer"
            >
              {metric.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
