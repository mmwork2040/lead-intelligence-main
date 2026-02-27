import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Gauge, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface LimitsConfig {
  max_leads_per_user: number;
  max_campaigns_per_user: number;
  max_products_per_user: number;
  auto_sync_enabled: boolean;
  sync_interval_hours: number;
}

const DEFAULT_LIMITS: LimitsConfig = {
  max_leads_per_user: 10000,
  max_campaigns_per_user: 50,
  max_products_per_user: 100,
  auto_sync_enabled: true,
  sync_interval_hours: 6,
};

export function SystemLimitsPanel() {
  const [config, setConfig] = useState<LimitsConfig>(DEFAULT_LIMITS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "system_limits")
        .maybeSingle();

      if (data?.value) {
        const val = data.value as Record<string, Json>;
        setConfig({
          max_leads_per_user: (val.max_leads_per_user as number) || DEFAULT_LIMITS.max_leads_per_user,
          max_campaigns_per_user: (val.max_campaigns_per_user as number) || DEFAULT_LIMITS.max_campaigns_per_user,
          max_products_per_user: (val.max_products_per_user as number) || DEFAULT_LIMITS.max_products_per_user,
          auto_sync_enabled: val.auto_sync_enabled !== undefined ? (val.auto_sync_enabled as boolean) : DEFAULT_LIMITS.auto_sync_enabled,
          sync_interval_hours: (val.sync_interval_hours as number) || DEFAULT_LIMITS.sync_interval_hours,
        });
      }
    } catch (e) {
      console.error("Error loading limits config:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const value: Record<string, Json> = {
        max_leads_per_user: config.max_leads_per_user,
        max_campaigns_per_user: config.max_campaigns_per_user,
        max_products_per_user: config.max_products_per_user,
        auto_sync_enabled: config.auto_sync_enabled,
        sync_interval_hours: config.sync_interval_hours,
      };

      const { error } = await supabase
        .from("system_config")
        .upsert({ key: "system_limits", value }, { onConflict: "key" });

      if (error) throw error;
      toast.success("Limites salvos com sucesso!");
    } catch (e) {
      console.error("Error saving limits:", e);
      toast.error("Erro ao salvar limites");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Gauge className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Limites e Cotas</CardTitle>
            <CardDescription>
              Defina limites de uso por usuário e configurações de sincronização
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Máx. Leads por Usuário</Label>
            <Input
              type="number"
              value={config.max_leads_per_user}
              onChange={(e) =>
                setConfig((c) => ({ ...c, max_leads_per_user: parseInt(e.target.value) || 0 }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Máx. Campanhas por Usuário</Label>
            <Input
              type="number"
              value={config.max_campaigns_per_user}
              onChange={(e) =>
                setConfig((c) => ({ ...c, max_campaigns_per_user: parseInt(e.target.value) || 0 }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Máx. Produtos por Usuário</Label>
            <Input
              type="number"
              value={config.max_products_per_user}
              onChange={(e) =>
                setConfig((c) => ({ ...c, max_products_per_user: parseInt(e.target.value) || 0 }))
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
          <div>
            <Label className="text-sm font-medium">Sincronização Automática</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Sincronizar Facebook Ads automaticamente
            </p>
          </div>
          <Switch
            checked={config.auto_sync_enabled}
            onCheckedChange={(checked) =>
              setConfig((c) => ({ ...c, auto_sync_enabled: checked }))
            }
          />
        </div>

        {config.auto_sync_enabled && (
          <div className="space-y-2">
            <Label>Intervalo de Sincronização (horas)</Label>
            <Input
              type="number"
              value={config.sync_interval_hours}
              onChange={(e) =>
                setConfig((c) => ({ ...c, sync_interval_hours: parseInt(e.target.value) || 1 }))
              }
              min={1}
              max={24}
            />
          </div>
        )}

        <Button onClick={saveConfig} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Limites
        </Button>
      </CardContent>
    </Card>
  );
}
