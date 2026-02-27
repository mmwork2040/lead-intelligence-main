import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon?: ReactNode;
  iconColor?: "blue" | "green" | "orange" | "red" | "purple" | "cyan";
  className?: string;
  tooltip?: string;
  isLoading?: boolean;
  style?: React.CSSProperties;
  sparkline?: ReactNode;
  onClick?: () => void;
}

const iconColorClasses = {
  blue: "bg-primary/10 text-primary border border-primary/20",
  green: "bg-foreground text-acid dark:bg-acid/10 dark:text-acid border border-foreground/10 dark:border-acid/20",
  orange: "bg-[rgba(245,158,11,0.12)] text-[hsl(38,92%,45%)] dark:text-[hsl(45,100%,55%)] border border-[rgba(245,158,11,0.20)]",
  red: "bg-destructive/10 text-destructive border border-destructive/20",
  purple: "bg-primary/10 text-primary border border-primary/20",
  cyan: "bg-foreground text-acid dark:bg-acid/10 dark:text-acid border border-foreground/10 dark:border-acid/20",
};

const MetricCard = ({
  title,
  value,
  change,
  icon,
  iconColor = "green",
  className,
  tooltip,
  isLoading,
  style,
  sparkline,
  onClick,
}: MetricCardProps) => {
  if (isLoading) {
    return (
      <div
        className={cn(
          "glass rounded-2xl p-4 md:p-5",
          className
        )}
        style={style}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass rounded-2xl p-4 md:p-5",
        "transition-all duration-200 hover:shadow-sh-2 hover:-translate-y-px",
        onClick && "cursor-pointer",
        className
      )}
      style={style}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">
              {title}
            </p>
            {tooltip && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-xs">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <p className="text-sm md:text-2xl font-bold tracking-[-0.04em] text-foreground font-tight break-all">
            {value}
          </p>

          {change && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                  change.trend === "up" && "bg-success/10 text-success dark:text-acid",
                  change.trend === "down" && "bg-destructive/10 text-destructive",
                  change.trend === "neutral" && "bg-[var(--glass-input)] text-muted-foreground"
                )}
              >
                {change.trend === "up" && <TrendingUp className="h-3 w-3" />}
                {change.trend === "down" && <TrendingDown className="h-3 w-3" />}
                {change.value}
              </span>
              <span className="text-[10px] md:text-xs text-muted-foreground">
                vs. anterior
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              iconColorClasses[iconColor]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {sparkline && (
        <div className="mt-3 h-10">
          {sparkline}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
