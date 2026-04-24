import { useState, useEffect, lazy, Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Webhook, Copy, Check, Activity, Save, RefreshCw, Loader2, AlertCircle, ExternalLink, AlertTriangle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFacebookAdsConfig, useSaveFacebookAdsConfig, useSyncFacebookAds, useTestFacebookConnection } from "@/hooks/useFacebookAdsConfig";
import { useFacebookTokenStatus } from "@/hooks/useFacebookTokenStatus";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const WebhookLogsContent = lazy(() => import("@/components/integrations/WebhookLogsContent"));

const Integrations = () => {
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("connections");

  const { data: fbConfig, isLoading: fbLoading } = useFacebookAdsConfig();
  const { mutate: saveConfig, isPending: savePending } = useSaveFacebookAdsConfig();
  const { mutate: testConnection, isPending: testPending } = useTestFacebookConnection();
  const { mutate: syncAds, isPending: syncPending } = useSyncFacebookAds();
  const { data: tokenStatus, isLoading: tokenStatusLoading } = useFacebookTokenStatus(!!fbConfig);

  const [fbForm, setFbForm] = useState({
    accessToken: "",
    adAccountId: "",
  });

  // Update form when config loads
  useEffect(() => {
    if (fbConfig) {
      setFbForm({
        accessToken: "••••••••••••••••",
        adAccountId: fbConfig.ad_account_id,
      });
    }
  }, [fbConfig]);

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  const webhooks = [
    {
      name: "Hotmart",
      endpoint: `${baseUrl}/webhook-hotmart`,
      description: "Recebe eventos de vendas, compras e atualizações da Hotmart",
      events: ["PURCHASE_COMPLETE", "PURCHASE_APPROVED", "PURCHASE_REFUNDED", "PURCHASE_CANCELED"],
      color: "bg-orange-500"
    },
    {
      name: "ManyChat",
      endpoint: `${baseUrl}/webhook-manychat`,
      description: "Captura leads de conversas no WhatsApp e Instagram via ManyChat",
      events: ["NEW_SUBSCRIBER", "TAG_ADDED", "CUSTOM_FIELD_UPDATED"],
      color: "bg-[hsl(160,55%,40%)] dark:bg-[#CCFF00]"
    },
    {
      name: "N8N",
      endpoint: `${baseUrl}/webhook-n8n`,
      description: "Webhook genérico para automações personalizadas via N8N",
      events: ["CUSTOM_EVENT", "LEAD_CAPTURE", "FORM_SUBMISSION"],
      color: "bg-purple-500"
    }
  ];

  const copyToClipboard = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);

    toast({
      title: "URL copiada!",
      description: `Webhook ${name} copiado para área de transferência`,
    });

    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleSaveFacebookAds = () => {
    if (!fbForm.accessToken || !fbForm.adAccountId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o Access Token e o Ad Account ID",
        variant: "destructive",
      });
      return;
    }

    // Inform user when the masked token is being kept
    if (fbForm.accessToken === "••••••••••••••••" && fbConfig?.id) {
      toast({
        title: "Token mantido",
        description: "O Access Token anterior foi mantido. Apenas o Ad Account ID será atualizado.",
      });
    }

    saveConfig({
      accessToken: fbForm.accessToken,
      adAccountId: fbForm.adAccountId,
      existingConfigId: fbConfig?.id,
    });
  };

  const handleTestConnection = () => {
    if (!fbForm.accessToken || !fbForm.adAccountId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o Access Token e o Ad Account ID para testar",
        variant: "destructive",
      });
      return;
    }

    // Use the actual token if it's not masked
    const tokenToTest = fbForm.accessToken !== "••••••••••••••••"
      ? fbForm.accessToken
      : fbConfig?.access_token || "";

    testConnection({
      accessToken: tokenToTest,
      adAccountId: fbForm.adAccountId,
    });
  };

  const handleQuickSync = () => {
    if (!fbConfig) {
      toast({
        title: "Configuração necessária",
        description: "Configure o Facebook Ads antes de sincronizar",
        variant: "destructive",
      });
      return;
    }

    syncAds({ syncMode: "quick", daysBack: 14, activeOnly: true });
  };

  const handleFullSync = () => {
    if (!fbConfig) {
      toast({
        title: "Configuração necessária",
        description: "Configure o Facebook Ads antes de sincronizar",
        variant: "destructive",
      });
      return;
    }

    syncAds({ syncMode: "full", daysBack: 90, activeOnly: false });
  };

  // Determine token status for badge
  const getTokenStatusBadge = () => {
    if (!fbConfig) {
      return <Badge variant="secondary">Não configurado</Badge>;
    }
    if (tokenStatusLoading) {
      return <Badge variant="secondary"><Loader2 className="h-3 w-3 animate-spin mr-1" />Verificando...</Badge>;
    }
    if (tokenStatus?.isExpired) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Token Expirado</Badge>;
    }
    if (tokenStatus?.isValid === false) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Erro</Badge>;
    }
    return <Badge variant="default"><Check className="h-3 w-3 mr-1" />Ativo</Badge>;
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Top-level tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Conexões
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Connections Tab */}
        <TabsContent value="connections" className="mt-6 space-y-8">
          {/* Token Error Alert */}
          {fbConfig && tokenStatus?.isValid === false && !tokenStatus?.isExpired && tokenStatus?.errorMessage && (
            <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <AlertTitle className="text-orange-700 dark:text-orange-400">
                Erro na conexão com Facebook Ads
              </AlertTitle>
              <AlertDescription className="text-orange-600 dark:text-orange-300">
                {tokenStatus.errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Facebook Ads Integration */}
          <Card className={tokenStatus?.isExpired ? "border-destructive" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Facebook Ads API</CardTitle>
                  <CardDescription className="mt-2">
                    Sincronize campanhas, anúncios e métricas automaticamente
                  </CardDescription>
                </div>
                {getTokenStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {fbLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fb_access_token">Access Token</Label>
                    <Input
                      id="fb_access_token"
                      type="password"
                      placeholder="Digite seu Facebook Access Token"
                      value={fbForm.accessToken}
                      onChange={(e) => setFbForm({ ...fbForm, accessToken: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Obtenha em:{" "}
                      <a
                        href="https://developers.facebook.com/tools/explorer/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Facebook Graph API Explorer
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fb_ad_account_id">Ad Account ID</Label>
                    <Input
                      id="fb_ad_account_id"
                      type="text"
                      placeholder="Ex: 123456789"
                      value={fbForm.adAccountId}
                      onChange={(e) => setFbForm({ ...fbForm, adAccountId: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Encontre em:{" "}
                      <a
                        href="https://business.facebook.com/settings/ad-accounts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Configurações de Conta de Anúncios
                      </a>
                    </p>
                  </div>

                  {fbConfig?.last_sync_at && (
                    <div className="text-sm text-muted-foreground">
                      Última sincronização:{" "}
                      {format(new Date(fbConfig.last_sync_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSaveFacebookAds} disabled={savePending}>
                      {savePending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" />Salvar Configuração</>
                      )}
                    </Button>

                    <Button
                      onClick={handleTestConnection}
                      disabled={testPending || !fbForm.accessToken || !fbForm.adAccountId}
                      variant="outline"
                    >
                      {testPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testando...</>
                      ) : (
                        <><AlertCircle className="mr-2 h-4 w-4" />Testar Conexão</>
                      )}
                    </Button>

                    {fbConfig && (
                      <>
                        <Button onClick={handleQuickSync} disabled={syncPending} variant="secondary">
                          {syncPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sincronizando...</>
                          ) : (
                            <><RefreshCw className="mr-2 h-4 w-4" />Sync Rápida</>
                          )}
                        </Button>
                        <Button
                          onClick={handleFullSync}
                          disabled={syncPending}
                          variant="outline"
                          title="Sincroniza últimos 90 dias com todos os dados"
                        >
                          {syncPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sincronizando...</>
                          ) : (
                            <><RefreshCw className="mr-2 h-4 w-4" />Sync Completa</>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Help Card for Facebook Token Permissions */}
          <Alert className="border-primary/30 bg-primary/5">
            <AlertCircle className="h-5 w-5 text-primary" />
            <AlertTitle className="text-base font-semibold mb-3">
              Como gerar o Token correto do Facebook (Recomendado)
            </AlertTitle>
            <AlertDescription className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Para que a sincronização funcione de forma permanente, recomendamos usar um <span className="font-bold text-foreground">System User Token</span>. Tokens gerados pelo Explorer expiram em poucas horas.
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="font-bold text-primary shrink-0 text-base">A.</span>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Método Profissional (System User):</p>
                    <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
                      <li>Acesse as <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Configurações do Negócio</a>.</li>
                      <li>Selecione ou crie um <b>Usuário do Sistema</b> (Admin).</li>
                      <li>Clique em <b>"Gerar Novo Token"</b>.</li>
                      <li>Selecione o seu <b>App</b> e marque: <code className="text-xs bg-muted p-1 rounded">ads_read</code> e <code className="text-xs bg-muted p-1 rounded">ads_management</code>.</li>
                      <li>Copie o token e salve acima.</li>
                    </ol>
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="flex gap-3">
                  <span className="font-bold text-primary shrink-0 text-base">B.</span>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Método Rápido (Teste):</p>
                    <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
                      <li>Acesse o <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Graph API Explorer</a>.</li>
                      <li>No dropdown <b>"Meta App"</b>, selecione o seu App (não use o default).</li>
                      <li>Em <b>"Permissions"</b>, adicione <code className="text-xs bg-muted p-1 rounded">ads_read</code> e <code className="text-xs bg-muted p-1 rounded">ads_management</code>.</li>
                      <li>Clique em <b>Generate Access Token</b>.</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-4 flex gap-3 items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  <span className="font-bold uppercase mr-1">Importante:</span> 
                  O ID da Conta de Anúncios deve ser numérico (ex: 123456789). O sistema adicionará o prefixo "act_" automaticamente se necessário.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <Separator />

          {/* Webhooks Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Webhooks</h2>
            <div className="grid gap-6">
              {webhooks.map((webhook) => (
                <Card key={webhook.name} className="border-border/50 hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${webhook.color} bg-opacity-10`}>
                          <Webhook className={`h-5 w-5 ${webhook.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {webhook.name}
                            <Badge variant="outline" className="ml-2">
                              <Activity className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">{webhook.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Webhook URL</label>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="flex-1 px-3 py-2 bg-muted/50 rounded-lg text-sm font-mono text-foreground border border-border">
                          {webhook.endpoint}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(webhook.endpoint, webhook.name)}
                          className="shrink-0"
                        >
                          {copiedUrl === webhook.endpoint ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Eventos capturados</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="secondary" className="font-mono text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground">
                        Cole esta URL na configuração de webhooks da plataforma {webhook.name}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* How to Configure */}
          <Card className="border-accent/50 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg">Como configurar webhooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <span className="font-bold text-accent">1.</span>
                <p>Copie a URL do webhook que deseja integrar</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-accent">2.</span>
                <p>Acesse as configurações da plataforma (Hotmart, ManyChat ou N8N)</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-accent">3.</span>
                <p>Adicione a URL copiada na seção de webhooks/notificações</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-accent">4.</span>
                <p>Os leads serão capturados automaticamente e unificados no sistema</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Suspense fallback={<PageSkeleton />}>
            <WebhookLogsContent />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
};

export default Integrations;
