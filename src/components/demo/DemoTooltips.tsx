import { useState, useEffect } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { useLocation } from "react-router-dom";
import { demoTourSteps } from "@/services/demoData";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, PartyPopper } from "lucide-react";

const TOUR_KEY = "demo-tour-step";

export function DemoTooltips() {
  const { isDemo } = useDemo();
  const location = useLocation();
  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem(TOUR_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(TOUR_KEY, String(step));
  }, [step]);

  // Only show on dashboard
  if (!isDemo || location.pathname !== "/dashboard" || dismissed || step >= demoTourSteps.length) {
    return null;
  }

  const current = demoTourSteps[step];
  const isLast = step === demoTourSteps.length - 1;

  const next = () => {
    if (isLast) {
      setDismissed(true);
      sessionStorage.setItem(TOUR_KEY, String(demoTourSteps.length));
    } else {
      setStep(step + 1);
    }
  };

  const skip = () => {
    setDismissed(true);
    sessionStorage.setItem(TOUR_KEY, String(demoTourSteps.length));
  };

  return (
    <div className="fixed inset-0 z-[55] pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] pointer-events-auto" onClick={skip} />
      
      {/* Tooltip card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[calc(50%+128px)] pointer-events-auto max-w-sm w-[90vw]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xl animate-in fade-in-0 zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-semibold text-foreground">{current.title}</h3>
            <button onClick={skip} className="p-1 rounded-full hover:bg-muted transition-colors -mt-1 -mr-1">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {current.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {demoTourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === step ? "bg-primary" : i < step ? "bg-primary/40" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {!isLast && (
                <Button variant="ghost" size="sm" onClick={skip} className="text-xs h-8">
                  Pular tour
                </Button>
              )}
              <Button size="sm" onClick={next} className="text-xs h-8 gap-1 rounded-full">
                {isLast ? (
                  <>
                    <PartyPopper className="w-3.5 h-3.5" />
                    Explorar
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
