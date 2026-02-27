import { useDemo } from "@/contexts/DemoContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, X, UserPlus } from "lucide-react";

export function DemoBanner() {
  const { isDemo, exitDemo } = useDemo();
  const navigate = useNavigate();

  if (!isDemo) return null;

  const handleCreateAccount = () => {
    exitDemo();
    navigate("/auth");
  };

  const handleExit = () => {
    exitDemo();
    navigate("/");
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] md:left-[calc(50%+128px)]">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-primary/95 text-primary-foreground shadow-lg backdrop-blur-sm border border-primary-foreground/10">
        <Eye className="w-4 h-4 shrink-0 animate-pulse" />
        <span className="text-sm font-medium whitespace-nowrap">Modo Demonstração</span>
        <div className="w-px h-5 bg-primary-foreground/20" />
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-xs rounded-full gap-1 px-3"
          onClick={handleCreateAccount}
        >
          <UserPlus className="w-3 h-3" />
          Criar Conta Grátis
        </Button>
        <button
          onClick={handleExit}
          className="p-1 rounded-full hover:bg-primary-foreground/10 transition-colors"
          aria-label="Sair da demonstração"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
