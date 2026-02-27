import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, XCircle, MailCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useValidateInvitation } from "@/hooks/useTeamInvitations";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const emailConfirmed = searchParams.get("confirmed") === "true";
  const confirmationError = searchParams.get("error") === "confirmation_failed";
  const inviteToken = searchParams.get("invite");
  
  const { data: invitation, isLoading: inviteLoading } = useValidateInvitation(inviteToken);
  
  const initialTab = inviteToken ? "signup" : "login";
  const [activeTab, setActiveTab] = useState(initialTab);

  const from = (location.state as { from?: string })?.from || "/dashboard";

  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  const passwordsMatch = confirmPassword.length > 0 && signupPassword === confirmPassword;
  const passwordsDontMatch = confirmPassword.length > 0 && signupPassword !== confirmPassword;

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      if (error.message.includes("Invalid login")) {
        setLoginError("Email ou senha incorretos");
      } else if (error.message.includes("Email not confirmed")) {
        setLoginError("Por favor, confirme seu email antes de fazer login");
      } else {
        setLoginError("Erro ao fazer login. Tente novamente.");
      }
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignupError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPwd = formData.get("confirmPassword") as string;

    if (password !== confirmPwd) {
      setSignupError("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setSignupError("A senha deve ter pelo menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    const { error, data } = await signUp(email, password);
    setIsLoading(false);
    if (error) {
      if (error.message.includes("already registered")) {
        setSignupError("Este email já está cadastrado");
      } else if (error.message.includes("valid email")) {
        setSignupError("Por favor, insira um email válido");
      } else {
        setSignupError("Erro ao criar conta. Tente novamente.");
      }
    } else {
      // If email confirmation is required, user won't have a session
      if (data?.user && !data?.session) {
        setSignupSuccess(true);
      } else {
        navigate(from, { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      <div className="w-full max-w-md space-y-4 relative z-10">
        <Card variant="elevated" className="border-border/50">
          <CardHeader className="space-y-1 text-center pb-2">
            <div className="w-14 h-14 rounded-xl bg-primary mx-auto mb-3 flex items-center justify-center text-primary-foreground font-bold text-2xl">L</div>
            <CardTitle className="text-2xl md:text-3xl font-bold">
              Leads Intelligence
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Entre com sua conta para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Invite banner */}
            {inviteToken && invitation && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm mb-4 animate-in fade-in duration-300">
                <UserPlus className="h-4 w-4 flex-shrink-0" />
                <span>Você foi convidado para a equipe! Cadastre-se com o email <strong>{invitation.email}</strong> para ter acesso.</span>
              </div>
            )}
            {inviteToken && !inviteLoading && !invitation && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4 animate-in fade-in duration-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Convite inválido ou expirado. Solicite um novo convite ao administrador.</span>
              </div>
            )}
            {emailConfirmed && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] border border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)] text-[hsl(160,55%,40%)] dark:text-[#CCFF00] text-sm mb-4 animate-in fade-in duration-300">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Email confirmado com sucesso! Faça login para continuar.</span>
              </div>
            )}
            {confirmationError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4 animate-in fade-in duration-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Erro ao confirmar email. Tente novamente ou faça um novo cadastro.</span>
              </div>
            )}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger
                  value="login"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:glow-sm"
                  onClick={() => setLoginError(null)}
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:glow-sm"
                  onClick={() => setSignupError(null)}
                >
                  Cadastro
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4 mt-6">
                  {/* Error Alert */}
                  {loginError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in slide-in-from-top-2 duration-200">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      disabled={isLoading}
                      variant="glow"
                      className={cn(loginError && "border-destructive/50")}
                      onChange={() => setLoginError(null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      variant="glow"
                      className={cn(loginError && "border-destructive/50")}
                      onChange={() => setLoginError(null)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                {signupSuccess ? (
                  <div className="flex flex-col items-center gap-4 py-8 text-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.12)] dark:bg-[rgba(204,255,0,0.08)] flex items-center justify-center">
                      <MailCheck className="h-8 w-8 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Verifique seu email</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Enviamos um link de confirmação para o email cadastrado. Clique no link para ativar sua conta.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSignupSuccess(false);
                        setSignupPassword("");
                        setConfirmPassword("");
                        setActiveTab("login");
                      }}
                    >
                      Voltar ao login
                    </Button>
                  </div>
                ) : (
                <form onSubmit={handleSignUp} className="space-y-4 mt-6">
                  {/* Error Alert */}
                  {signupError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in slide-in-from-top-2 duration-200">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{signupError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      disabled={isLoading || !!(invitation?.email)}
                      variant="glow"
                      defaultValue={invitation?.email || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      disabled={isLoading}
                      variant="glow"
                      value={signupPassword}
                      onChange={(e) => {
                        setSignupPassword(e.target.value);
                        setSignupError(null);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Mínimo de 6 caracteres
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        disabled={isLoading}
                        variant="glow"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setSignupError(null);
                        }}
                        className={cn(
                          "pr-10",
                          passwordsMatch && "border-[hsl(160,55%,40%)]/50 dark:border-[#CCFF00]/50 focus:border-[hsl(160,55%,40%)] dark:focus:border-[#CCFF00]",
                          passwordsDontMatch && "border-destructive/50"
                        )}
                      />
                      {/* Password match indicator */}
                      {confirmPassword.length > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {passwordsMatch ? (
                            <CheckCircle2 className="h-5 w-5 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                      )}
                    </div>
                    {passwordsDontMatch && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        As senhas não coincidem
                      </p>
                    )}
                    {passwordsMatch && (
                      <p className="text-xs text-[hsl(160,55%,40%)] dark:text-[#CCFF00] flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Senhas coincidem
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || passwordsDontMatch}
                  >
                    {isLoading ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
