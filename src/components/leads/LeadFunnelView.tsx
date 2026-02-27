import { cn } from "@/lib/utils";

interface LeadFunnelViewProps {
  currentStatus: string;
}

const FUNNEL_STAGES = [
  { value: "lead", label: "Lead Capturado" },
  { value: "engajado", label: "Engajado" },
  { value: "aquecido", label: "Aquecido" },
  { value: "carrinho", label: "Carrinho" },
  { value: "comprador", label: "Comprador" },
  { value: "perdido", label: "Perdido" },
];

export const LeadFunnelView = ({ currentStatus }: LeadFunnelViewProps) => {
  const currentIndex = FUNNEL_STAGES.findIndex((s) => s.value === currentStatus);

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="text-sm font-semibold mb-4">Jornada do Lead</h3>
      
      <div className="flex items-center justify-between gap-2 mb-4">
        {FUNNEL_STAGES.map((stage, index) => {
          const isActive = index === currentIndex;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;
          
          return (
            <div key={stage.value} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                    isPast && "bg-primary text-primary-foreground",
                    isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isFuture && "bg-muted text-muted-foreground"
                  )}
                >
                  {isPast ? "✓" : index + 1}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 text-center",
                    isActive && "font-semibold text-foreground",
                    !isActive && "text-muted-foreground"
                  )}
                >
                  {stage.label}
                </span>
              </div>
              
              {index < FUNNEL_STAGES.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-all",
                    isPast ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        Etapas Concluídas: {currentIndex + 1}/{FUNNEL_STAGES.length}
      </div>
    </div>
  );
};
