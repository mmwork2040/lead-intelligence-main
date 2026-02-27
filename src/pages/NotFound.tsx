import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto">
        {/* Animated 404 illustration */}
        <div className="mb-8 relative">
          <div className="text-[150px] md:text-[200px] font-bold leading-none text-muted-foreground/10 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/50" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Página não encontrada
        </h1>
        <p className="text-muted-foreground mb-8 text-base md:text-lg">
          Ops! A página que você está procurando não existe ou foi movida.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full sm:w-auto gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto gap-2"
          >
            <Home className="h-4 w-4" />
            Ir para o Dashboard
          </Button>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Talvez você esteja procurando por:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Leads", href: "/leads" },
              { label: "Campanhas", href: "/campaigns" },
              { label: "Produtos", href: "/products" },
              { label: "Relatórios", href: "/reports" },
            ].map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                onClick={() => navigate(link.href)}
                className="text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
