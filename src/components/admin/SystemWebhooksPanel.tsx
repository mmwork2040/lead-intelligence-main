import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Webhook, Copy, Check, Activity } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const webhooks = [
  {
    name: "Hotmart",
    endpoint: `${BASE_URL}/webhook-hotmart`,
    description: "Recebe eventos de vendas, compras e atualizações da Hotmart",
    events: ["PURCHASE_COMPLETE", "PURCHASE_APPROVED", "PURCHASE_REFUNDED"],
    color: "bg-[hsl(38,92%,50%)]",
  },
  {
    name: "ManyChat",
    endpoint: `${BASE_URL}/webhook-manychat`,
    description: "Captura leads de conversas via ManyChat",
    events: ["NEW_SUBSCRIBER", "TAG_ADDED", "CUSTOM_FIELD_UPDATED"],
    color: "bg-[hsl(160,55%,40%)] dark:bg-[#CCFF00]",
  },
  {
    name: "N8N",
    endpoint: `${BASE_URL}/webhook-n8n`,
    description: "Webhook genérico para automações via N8N",
    events: ["CUSTOM_EVENT", "LEAD_CAPTURE", "FORM_SUBMISSION"],
    color: "bg-foreground dark:bg-muted",
  },
  {
    name: "Tracking Pixel",
    endpoint: `${BASE_URL}/webhook-tracking-pixel`,
    description: "Captura dados de formulários e visitas via pixel de rastreamento",
    events: ["FORM_SUBMIT", "PAGE_VIEW"],
    color: "bg-[hsl(160,55%,40%)] dark:bg-[#CCFF00]",
  },
];

export function SystemWebhooksPanel() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success(`Webhook ${name} copiado!`);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Webhook className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Webhooks Globais</CardTitle>
            <CardDescription>
              Endpoints de webhook disponíveis para todos os usuários do sistema
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {webhooks.map((webhook) => (
          <div
            key={webhook.name}
            className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/30"
          >
            <div className={`p-2 rounded-lg ${webhook.color} bg-opacity-10 shrink-0`}>
              <Webhook className={`h-4 w-4 ${webhook.color.replace("bg-", "text-")}`} />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{webhook.name}</span>
                <Badge variant="outline" className="text-[10px]">
                  <Activity className="h-2.5 w-2.5 mr-1" />
                  Ativo
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{webhook.description}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2 py-1 bg-background rounded text-[11px] font-mono text-muted-foreground border border-border truncate">
                  {webhook.endpoint}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyToClipboard(webhook.endpoint, webhook.name)}
                >
                  {copiedUrl === webhook.endpoint ? (
                    <Check className="h-3.5 w-3.5 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {webhook.events.map((event) => (
                  <Badge key={event} variant="secondary" className="text-[10px] font-mono">
                    {event}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
