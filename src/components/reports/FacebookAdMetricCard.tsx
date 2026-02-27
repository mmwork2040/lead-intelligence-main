import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FacebookAdMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number; // percentage change
  format?: "currency" | "number" | "percent";
}

export function FacebookAdMetricCard({
  icon: Icon,
  label,
  value,
  trend,
  format = "number",
}: FacebookAdMetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === "string") return val;
    
    if (format === "currency") {
      if (val >= 1000000) {
        return `R$ ${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `R$ ${(val / 1000).toFixed(1)}K`;
      }
      return `R$ ${val.toFixed(2)}`;
    }
    
    if (format === "percent") {
      return `${val.toFixed(1)}%`;
    }
    
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    
    return val.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  };

  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-soft hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 bg-foreground dark:bg-[rgba(204,255,0,0.08)] rounded-lg">
          <Icon className="h-5 w-5 text-[#CCFF00]" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      
      <div className="mt-3">
        <div className="text-xl font-bold text-foreground truncate">
          {formatValue(value)}
        </div>
        
        {trend !== undefined && (
          <div className="flex items-center mt-1">
            <span
              className={cn(
                "text-xs font-medium flex items-center gap-1",
                isPositive && "text-[hsl(160,55%,40%)] dark:text-[#CCFF00]",
                isNegative && "text-red-500",
                !isPositive && !isNegative && "text-muted-foreground"
              )}
            >
              {isPositive && "▲"}
              {isNegative && "▼"}
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
