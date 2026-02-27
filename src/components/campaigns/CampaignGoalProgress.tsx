import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { CampaignGoal } from "@/hooks/useCampaignGoals";

interface CampaignGoalProgressProps {
  goal: CampaignGoal;
  onEdit: (goal: CampaignGoal) => void;
  onDelete: (id: string) => void;
}

export function CampaignGoalProgress({ goal, onEdit, onDelete }: CampaignGoalProgressProps) {
  const progress = goal.target_value > 0 
    ? Math.min((goal.current_value / goal.target_value) * 100, 100) 
    : 0;

  const getProgressColor = () => {
    if (progress >= 100) return "bg-success";
    if (progress >= 75) return "bg-primary";
    if (progress >= 50) return "bg-warning";
    if (progress >= 25) return "bg-orange-500";
    return "bg-destructive";
  };

  const getMetricLabel = () => {
    switch (goal.metric_type) {
      case "leads":
        return "Leads";
      case "sales":
        return "Vendas";
      case "revenue":
        return "Receita";
      default:
        return goal.metric_type;
    }
  };

  const formatValue = (value: number) => {
    if (goal.metric_type === "revenue") {
      return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    }
    return value.toString();
  };

  return (
    <div className="space-y-2 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{getMetricLabel()}</span>
          <span className="text-xs text-muted-foreground">
            {formatValue(goal.current_value)} / {formatValue(goal.target_value)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold">{Math.round(progress)}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onEdit(goal)}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <Progress 
        value={progress} 
        className="h-2"
        indicatorClassName={getProgressColor()}
      />
    </div>
  );
}
