import {
  Eye,
  MousePointerClick,
  DollarSign,
  Target,
  Zap,
  TrendingUp,
  BarChart3,
  Users,
} from "lucide-react";
import { FacebookAdMetricCard } from "@/components/reports/FacebookAdMetricCard";
import { FacebookMetrics } from "@/hooks/useFacebookAdsHierarchicalReports";
import { LucideIcon } from "lucide-react";

interface MetricCardGridProps {
  totals: FacebookMetrics;
  visibleMetrics: string[];
  campaignCount: number;
}

type MetricFormat = "number" | "currency" | "percent";

interface MetricConfig {
  id: string;
  icon: LucideIcon;
  label: string;
  format?: MetricFormat;
  getValue: (totals: FacebookMetrics, campaignCount: number) => number;
}

const metricConfigs: MetricConfig[] = [
  {
    id: "conversions",
    icon: Target,
    label: "Conversões",
    getValue: (t) => t.conversions,
  },
  {
    id: "impressions",
    icon: Eye,
    label: "Impressões",
    getValue: (t) => t.impressions,
  },
  {
    id: "reach",
    icon: Users,
    label: "Alcance",
    getValue: (t) => t.reach,
  },
  {
    id: "clicks",
    icon: MousePointerClick,
    label: "Cliques",
    getValue: (t) => t.clicks,
  },
  {
    id: "spend",
    icon: DollarSign,
    label: "Gasto Total",
    format: "currency",
    getValue: (t) => t.spend,
  },
  {
    id: "cpc",
    icon: Zap,
    label: "CPC",
    format: "currency",
    getValue: (t) => t.cpc,
  },
  {
    id: "frequency",
    icon: TrendingUp,
    label: "Frequência",
    getValue: (t) => t.frequency,
  },
  {
    id: "cpm",
    icon: Eye,
    label: "CPM",
    format: "currency",
    getValue: (t) => t.cpm,
  },
  {
    id: "costPerConversion",
    icon: Target,
    label: "Custo/Conv",
    format: "currency",
    getValue: (t) => t.costPerConversion,
  },
  {
    id: "ctr",
    icon: MousePointerClick,
    label: "CTR",
    format: "percent",
    getValue: (t) => t.ctr,
  },
  {
    id: "roas",
    icon: DollarSign,
    label: "ROAS",
    getValue: (t) => t.roas,
  },
  {
    id: "campaigns",
    icon: BarChart3,
    label: "Campanhas",
    getValue: (_, count) => count,
  },
];

export function MetricCardGrid({
  totals,
  visibleMetrics,
  campaignCount,
}: MetricCardGridProps) {
  const visibleConfigs = metricConfigs.filter((config) =>
    visibleMetrics.includes(config.id)
  );

  if (visibleConfigs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma métrica selecionada. Use o botão "Personalizar Cards" para escolher métricas.
      </div>
    );
  }

  // Determine grid columns based on number of visible metrics
  const gridCols =
    visibleConfigs.length <= 4
      ? "grid-cols-2 md:grid-cols-4"
      : visibleConfigs.length <= 6
      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
      : "grid-cols-2 md:grid-cols-4 lg:grid-cols-6";

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {visibleConfigs.map((config) => (
        <FacebookAdMetricCard
          key={config.id}
          icon={config.icon}
          label={config.label}
          value={config.getValue(totals, campaignCount)}
          format={config.format}
        />
      ))}
    </div>
  );
}
