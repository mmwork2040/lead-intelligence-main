import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HierarchicalReportData } from "@/hooks/useFacebookAdsHierarchicalReports";
import { PeriodFilter, getPeriodLabel } from "@/lib/dateUtils";

interface FacebookAIInsightsProps {
  reportData: HierarchicalReportData;
  period: PeriodFilter;
  isLoading?: boolean;
}

export function FacebookAIInsights({ reportData, period, isLoading }: FacebookAIInsightsProps) {
  const [insights, setInsights] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsights = useCallback(async () => {
    if (isLoading || !reportData?.campaigns?.length) return;

    setIsGenerating(true);
    setInsights("");

    try {
      const context = {
        periodo: getPeriodLabel(period),
        totais: {
          impressoes: reportData.totals.impressions,
          alcance: reportData.totals.reach,
          cliques: reportData.totals.clicks,
          gasto: `R$ ${reportData.totals.spend.toFixed(2)}`,
          cpm: `R$ ${reportData.totals.cpm.toFixed(2)}`,
          cpc: `R$ ${reportData.totals.cpc.toFixed(2)}`,
          ctr: `${reportData.totals.ctr.toFixed(2)}%`,
          frequencia: reportData.totals.frequency.toFixed(2),
          conversoes: reportData.totals.conversions,
          custoConversao: `R$ ${reportData.totals.costPerConversion.toFixed(2)}`,
          roas: reportData.totals.roas.toFixed(2),
        },
        campanhas: reportData.campaigns.map((c) => ({
          nome: c.campaign_name,
          objetivo: c.objective,
          status: c.status,
          gasto: `R$ ${c.metrics.spend.toFixed(2)}`,
          impressoes: c.metrics.impressions,
          cliques: c.metrics.clicks,
          ctr: `${c.metrics.ctr.toFixed(2)}%`,
          cpc: `R$ ${c.metrics.cpc.toFixed(2)}`,
          conversoes: c.metrics.conversions,
          roas: c.metrics.roas.toFixed(2),
          conjuntos: c.adsets.length,
          anuncios: c.adsets.reduce((sum, a) => sum + a.ads.length, 0),
        })),
      };

      const prompt = `Analise os dados de campanhas Facebook Ads abaixo e forneça insights estratégicos:

${JSON.stringify(context, null, 2)}

Responda com:
1. Resumo executivo (1-2 frases)
2. 3-5 insights específicos numerados com emojis sobre performance das campanhas
3. Campanhas com melhor e pior desempenho
4. 2-3 ações recomendadas para otimização

Seja conciso, use dados concretos. Responda em português brasileiro.`;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          context: "facebook-ads-traffic",
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao gerar insights");
      }

      if (!response.body) throw new Error("Sem resposta");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              result += content;
              setInsights(result);
            }
          } catch {}
        }
      }

      setHasGenerated(true);
    } catch (e) {
      console.error("AI insights error:", e);
      setInsights("Erro ao gerar insights. O administrador precisa configurar a chave de API em Configurações > Inteligência Artificial.");
    } finally {
      setIsGenerating(false);
    }
  }, [reportData, period, isLoading]);

  useEffect(() => {
    setHasGenerated(false);
    setInsights("");
  }, [period.type, (period as any).startDate, (period as any).endDate]);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Insights de IA — Tráfego
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!reportData?.campaigns?.length) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Insights de IA — Tráfego
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={generateInsights}
                disabled={isGenerating}
                className="h-8"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
                {isGenerating ? "Analisando..." : hasGenerated ? "Atualizar" : "Gerar Insights"}
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {isGenerating && !insights ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : insights ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{insights}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Clique em "Gerar Insights" para análise de IA das suas campanhas de tráfego.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
