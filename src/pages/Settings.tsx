import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Users, Brain, Palette, Webhook as WebhookIcon, Gauge, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useUserRole";
import { AIConfigPanel } from "@/components/admin/AIConfigPanel";
import { SystemBrandingPanel } from "@/components/admin/SystemBrandingPanel";
import { SystemWebhooksPanel } from "@/components/admin/SystemWebhooksPanel";
import { SystemLimitsPanel } from "@/components/admin/SystemLimitsPanel";
import { UserManagementPanel } from "@/components/admin/UserManagementPanel";

export default function Settings() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin
                ? "Gerencie as configurações globais e personalizações do sistema"
                : "Gerencie suas integrações e preferências pessoais"}
            </p>
          </div>
          {isAdmin && (
            <Badge variant="default" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </Badge>
          )}
        </div>

        {isAdmin ? (
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1">
              <TabsTrigger value="general" className="gap-2 text-xs sm:text-sm py-2.5">
                <Palette className="h-4 w-4 hidden sm:block" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2 text-xs sm:text-sm py-2.5">
                <Brain className="h-4 w-4 hidden sm:block" />
                IA
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2 text-xs sm:text-sm py-2.5">
                <Users className="h-4 w-4 hidden sm:block" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="gap-2 text-xs sm:text-sm py-2.5">
                <WebhookIcon className="h-4 w-4 hidden sm:block" />
                Webhooks
              </TabsTrigger>
              <TabsTrigger value="limits" className="gap-2 text-xs sm:text-sm py-2.5">
                <Gauge className="h-4 w-4 hidden sm:block" />
                Limites
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <SystemBrandingPanel />

              {/* Quick links for non-admin sections */}
              <Card
                className="hover:shadow-lg cursor-pointer transition-all"
                onClick={() => navigate("/integrations")}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <SettingsIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Minhas Integrações</CardTitle>
                      <CardDescription>
                        Configure suas integrações pessoais com Facebook Ads, Hotmart e outras fontes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="default" className="w-full">
                    Configurar Integrações
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai">
              <AIConfigPanel />
            </TabsContent>

            <TabsContent value="users">
              <UserManagementPanel />
            </TabsContent>

            <TabsContent value="webhooks">
              <SystemWebhooksPanel />
            </TabsContent>

            <TabsContent value="limits">
              <SystemLimitsPanel />
            </TabsContent>
          </Tabs>
        ) : (
          /* Non-admin: simple cards for own integrations */
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="hover:shadow-lg cursor-pointer transition-all"
              onClick={() => navigate("/integrations")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Minhas Integrações</CardTitle>
                    <CardDescription>
                      Configure Facebook Ads, Webhooks e outras integrações
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="default" className="w-full">
                  Configurar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
