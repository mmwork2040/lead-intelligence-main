import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PeriodFilter, PeriodType, calculateDateRange } from "@/lib/dateUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PeriodSelectorProps {
  value: PeriodFilter;
  onChange: (period: PeriodFilter) => void;
}

const periods: { type: PeriodType; label: string }[] = [
  { type: "today", label: "Hoje" },
  { type: "24h", label: "Últimas 24h" },
  { type: "3d", label: "Últimos 3 dias" },
  { type: "7d", label: "Últimos 7 dias" },
  { type: "15d", label: "Últimos 15 dias" },
  { type: "30d", label: "Últimos 30 dias" },
  { type: "3m", label: "Últimos 3 meses" },
  { type: "6m", label: "Últimos 6 meses" },
  { type: "1y", label: "Último ano" },
  { type: "all", label: "Todo o período" },
];

export const PeriodSelector = ({ value, onChange }: PeriodSelectorProps) => {
  const { startDate, endDate } = calculateDateRange(value);

  const currentLabel = periods.find((p) => p.type === value.type)?.label || "Selecione";

  return (
    <div className="flex items-center gap-3">
      <Select
        value={value.type}
        onValueChange={(type) => onChange({ type: type as PeriodType })}
      >
        <SelectTrigger className="w-[180px]">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Período">{currentLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => (
            <SelectItem key={period.type} value={period.type}>
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-xs text-muted-foreground hidden sm:inline">
        {format(startDate, "dd/MM/yy", { locale: ptBR })} - {format(endDate, "dd/MM/yy", { locale: ptBR })}
      </span>
    </div>
  );
};
