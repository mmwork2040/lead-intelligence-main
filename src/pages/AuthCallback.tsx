import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for auth code in URL (PKCE flow)
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setStatus("success");
          setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
          return;
        }

        // Check for hash fragments (implicit flow)
        const hash = window.location.hash;
        if (hash) {
          // Supabase client auto-detects hash tokens via onAuthStateChange
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setStatus("success");
            setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
            return;
          }
        }

        // No code or hash — redirect to login with confirmed flag
        navigate("/auth?confirmed=true", { replace: true });
      } catch (error) {
        console.error("Auth callback error:", error);
        setStatus("error");
        setTimeout(() => navigate("/auth?error=confirmation_failed", { replace: true }), 2500);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Verificando sua conta...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.12)] dark:bg-[rgba(204,255,0,0.08)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
            </div>
            <p className="text-foreground font-semibold">Conta verificada com sucesso!</p>
            <p className="text-sm text-muted-foreground">Redirecionando...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-foreground font-semibold">Erro na verificação</p>
            <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
