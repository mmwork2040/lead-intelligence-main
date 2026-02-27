import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function PendingApproval() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: role, isLoading, refetch } = useUserRole();
  const queryClient = useQueryClient();

  // If user gets a role assigned, redirect to dashboard
  useEffect(() => {
    if (role) {
      navigate("/dashboard", { replace: true });
    }
  }, [role, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleRetry = async () => {
    await queryClient.invalidateQueries({ queryKey: ["user-role"] });
    refetch();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-accent/50 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-accent-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Acesso Pendente</h1>
          <p className="text-muted-foreground">
            Sua conta foi criada com sucesso! Aguarde a liberação de acesso pelo administrador.
          </p>
        </div>

        <div className="glass rounded-xl p-4 text-left space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Email:</strong> {user?.email}
          </p>
          <p className="text-sm text-muted-foreground">
            O administrador do sistema precisa atribuir um perfil de acesso à sua conta antes que você possa utilizar a plataforma.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={handleRetry} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Tentar novamente
          </Button>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
