import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface MetricSelectorProps {
  selectedMetrics: string[];
  onMetricsChange: (metrics: string[]) => void;
}

const availableMetrics = [
  { id: "leads", label: "Leads" },
  { id: "sales", label: "Vendas" },
  { id: "revenue", label: "Receita" },
  { id: "adSpend", label: "Investimento" },
  { id: "cpl", label: "CPL" },
  { id: "cpa", label: "CPA" },
  { id: "roas", label: "ROAS" },
  { id: "conversionRate", label: "Taxa de Conversão" },
];

export function MetricSelector({ selectedMetrics, onMetricsChange }: MetricSelectorProps) {
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
