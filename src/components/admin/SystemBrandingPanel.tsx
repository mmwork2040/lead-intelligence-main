import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface BrandingConfig {
  system_name: string;
  system_description: string;
  logo_letter: string;
  primary_color: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  system_name: "Leads Intel",
  system_description: "Plataforma de gestão de leads e vendas",
  logo_letter: "L",
  primary_color: "#3B82F6",
};

export function SystemBrandingPanel() {
  const [config, setConfig] = useState<BrandingConfig>(DEFAULT_BRANDING);
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
        .eq("key", "branding")
        .maybeSingle();

      if (data?.value) {
        const val = data.value as Record<string, Json>;
        setConfig({
          system_name: (val.system_name as string) || DEFAULT_BRANDING.system_name,
          system_description: (val.system_description as string) || DEFAULT_BRANDING.system_description,
          logo_letter: (val.logo_letter as string) || DEFAULT_BRANDING.logo_letter,
          primary_color: (val.primary_color as string) || DEFAULT_BRANDING.primary_color,
        });
      }
    } catch (e) {
      console.error("Error loading branding config:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const value: Record<string, Json> = {
        system_name: config.system_name,
        system_description: config.system_description,
        logo_letter: config.logo_letter,
        primary_color: config.primary_color,
      };

      const { error } = await supabase
        .from("system_config")
        .upsert({ key: "branding", value }, { onConflict: "key" });

      if (error) throw error;
      toast.success("Identidade visual salva com sucesso!");
    } catch (e) {
      console.error("Error saving branding config:", e);
      toast.error("Erro ao salvar configuração");
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
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Identidade Visual</CardTitle>
            <CardDescription>
              Personalize o nome, logo e aparência do sistema
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome do Sistema</Label>
            <Input
              value={config.system_name}
              onChange={(e) => setConfig((c) => ({ ...c, system_name: e.target.value }))}
              placeholder="Nome do sistema"
            />
          </div>
          <div className="space-y-2">
            <Label>Letra do Logo</Label>
            <Input
              value={config.logo_letter}
              onChange={(e) => setConfig((c) => ({ ...c, logo_letter: e.target.value.slice(0, 2) }))}
              placeholder="L"
              maxLength={2}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea
            value={config.system_description}
            onChange={(e) => setConfig((c) => ({ ...c, system_description: e.target.value }))}
            placeholder="Descrição do sistema"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Cor Principal</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={config.primary_color}
              onChange={(e) => setConfig((c) => ({ ...c, primary_color: e.target.value }))}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer"
            />
            <Input
              value={config.primary_color}
              onChange={(e) => setConfig((c) => ({ ...c, primary_color: e.target.value }))}
              placeholder="#3B82F6"
              className="max-w-40"
            />
            <div
              className="h-10 flex-1 rounded-lg border border-border flex items-center justify-center text-sm font-medium text-white"
              style={{ backgroundColor: config.primary_color }}
            >
              {config.system_name}
            </div>
          </div>
        </div>

        <Button onClick={saveConfig} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Identidade Visual
        </Button>
      </CardContent>
    </Card>
  );
}
