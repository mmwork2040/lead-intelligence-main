import { BarChart3 } from "lucide-react";

interface EmptyChartProps {
  title?: string;
  description?: string;
  height?: number;
}

const EmptyChart = ({ 
  title = "Sem dados disponíveis", 
  description = "Não há dados para exibir no período selecionado",
  height = 320 
}: EmptyChartProps) => {
  return (
    <div 
      className="flex flex-col items-center justify-center text-muted-foreground rounded-xl bg-muted/20"
      style={{ height }}
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <BarChart3 className="w-7 h-7 text-muted-foreground/60" />
      </div>
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="text-xs text-center max-w-[220px] mt-1">{description}</p>
    </div>
  );
};

export default EmptyChart;
