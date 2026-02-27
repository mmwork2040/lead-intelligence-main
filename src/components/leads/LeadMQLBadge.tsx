import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getMQLLevelLabel, getMQLLevelColor, getMQLLevelIcon, MQLLevel } from "@/hooks/useLeadScore";

interface LeadMQLBadgeProps {
  score: number | null;
  level: MQLLevel | null;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LeadMQLBadge({ score, level, showScore = true, size = "md" }: LeadMQLBadgeProps) {
  if (!level && score === null) return null;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${getMQLLevelColor(level)} ${sizeClasses[size]} font-medium`}
          >
            {getMQLLevelIcon(level)} {getMQLLevelLabel(level)}
            {showScore && score !== null && (
              <span className="ml-1 opacity-75">({score})</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">Score MQL: {score ?? 0}/100</p>
            <p className="text-xs text-muted-foreground">
              {level === "qualified" && "Lead altamente qualificado - priorizar contato!"}
              {level === "hot" && "Lead quente - alta probabilidade de conversão"}
              {level === "warm" && "Lead morno - nutrir com conteúdo"}
              {level === "cold" && "Lead frio - precisa de mais aquecimento"}
              {!level && "Sem pesquisa MQL respondida"}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
