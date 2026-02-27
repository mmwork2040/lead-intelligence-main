import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Brain, Eye, EyeOff, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface AIConfig {
  provider: string;
  api_key: string;
  model: string;
}

const PROVIDERS = [
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { value: "anthropic", label: "Anthropic", models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"] },
  { value: "google", label: "Google AI", models: ["gemini-2.5-flash", "gemini-2.5-pro"] },
];

const DEFAULT_CONFIG: AIConfig = {
  provider: "openai",
  api_key: "",
  model: "gpt-4o-mini",
};

export function AIConfigPanel() {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "ai_config")
        .maybeSingle();

      if (data?.value) {
        const val = data.value as Record<string, Json>;
        setConfig({
          provider: (val.provider as string) || DEFAULT_CONFIG.provider,
          api_key: (val.api_key as string) || "",
          model: (val.model as string) || DEFAULT_CONFIG.model,
        });
      }
    } catch (e) {
      console.error("Error loading AI config:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config.api_key.trim()) {
      toast.error("Preencha a chave de API antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      const value: Record<string, Json> = {
        provider: config.provider,
        api_key: config.api_key,
        model: config.model,
      };

      const { error } = await supabase
        .from("system_config")
        .upsert({ key: "ai_config", value }, { onConflict: "key" });

      if (error) throw error;
      toast.success("Configuração de IA salva com sucesso!");
    } catch (e) {
      console.error("Error saving AI config:", e);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await supabase.functions.invoke("ai-assistant", {
        body: {
          messages: [{ role: "user", content: "Diga apenas: OK" }],
          context: "test",
          testConnection: true,
        },
      });

      if (response.error) throw response.error;
      setTestResult("success");
      toast.success("Conexão com IA testada com sucesso!");
    } catch (e) {
      setTestResult("error");
      toast.error("Falha no teste de conexão. Verifique a API key.");
    } finally {
      setTesting(false);
    }
  };

  const currentProvider = PROVIDERS.find((p) => p.value === config.provider);

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.slice(0, 4) + "•".repeat(key.length - 8) + key.slice(-4);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Inteligência Artificial</CardTitle>
              <CardDescription>
                Configure a chave de API de IA usada em todo o sistema. Sem ela, nenhuma funcionalidade de IA estará disponível.
              </CardDescription>
            </div>
          </div>
          <Badge variant={config.api_key ? "default" : "secondary"}>
            {config.api_key ? "Ativa" : "Não configurada"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider */}
        <div className="space-y-2">
          <Label>Provedor</Label>
          <Select
            value={config.provider}
            onValueChange={(provider) => {
              const prov = PROVIDERS.find((p) => p.value === provider);
              setConfig((c) => ({
                ...c,
                provider,
                model: prov?.models[0] || c.model,
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label>Modelo</Label>
          <Select
            value={config.model}
            onValueChange={(model) => setConfig((c) => ({ ...c, model }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currentProvider?.models.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label>Chave de API</Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={config.api_key}
              onChange={(e) => setConfig((c) => ({ ...c, api_key: e.target.value }))}
              placeholder="sk-..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A chave será armazenada de forma segura e usada em todas as funcionalidades de IA do sistema
          </p>
        </div>

        {/* Test result */}
        {testResult && (
          <div
            className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
              testResult === "success"
                ? "bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] text-[hsl(160,55%,40%)] dark:text-[#CCFF00]"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {testResult === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {testResult === "success"
              ? "Conexão testada com sucesso!"
              : "Falha na conexão. Verifique a chave de API."}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={saveConfig} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configuração
          </Button>
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={testing || !config.api_key}
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Testar Conexão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
