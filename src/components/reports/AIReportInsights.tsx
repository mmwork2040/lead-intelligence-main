import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedReportMetrics } from "@/hooks/useUnifiedReportMetrics";
import { PeriodFilter, getPeriodLabel } from "@/lib/dateUtils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AIReportInsightsProps {
  metrics: UnifiedReportMetrics;
  period: PeriodFilter;
  isLoading?: boolean;
}

export const AIReportInsights = ({ metrics, period, isLoading }: AIReportInsightsProps) => {
  const [insights, setInsights] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsights = async () => {
    if (isLoading || !metrics) return;
    
    setIsGenerating(true);
    try {
      const reportContext = {
        periodo: getPeriodLabel(period),
        metricas: {
          totalLeads: metrics.totalLeads,
          totalVendas: metrics.totalSales,
          receitaTotal: `R$ ${metrics.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          investimento: `R$ ${metrics.totalAdSpend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          roas: `${metrics.roas}x`,
          taxaConversao: `${metrics.conversionRate}%`
        },
        comparacaoPeriodoAnterior: {
          leads: `${metrics.leadsChange >= 0 ? "+" : ""}${metrics.leadsChange.toFixed(1)}%`,
          vendas: `${metrics.salesChange >= 0 ? "+" : ""}${metrics.salesChange.toFixed(1)}%`,
          receita: `${metrics.revenueChange >= 0 ? "+" : ""}${metrics.revenueChange.toFixed(1)}%`
        },
        topProdutos: metrics.productMetrics.slice(0, 3).map(p => ({
          nome: p.productName,
          vendas: p.sales,
          receita: `R$ ${p.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        })),
        topCampanhas: metrics.campaignMetrics.slice(0, 3).map(c => ({
          nome: c.campaignName,
          roas: `${c.roas}x`,
          receita: `R$ ${c.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        })),
        topOrigens: metrics.sourceMetrics.slice(0, 3).map(s => ({
          origem: s.source,
          leads: s.leads,
          conversao: `${s.conversion}%`
        }))
      };

      const prompt = `Analise os dados de marketing digital abaixo e forneça insights acionáveis em português brasileiro:

${JSON.stringify(reportContext, null, 2)}

Responda com:
1. Um resumo executivo em 1-2 frases
2. 3-5 insights específicos numerados com emojis
3. 2-3 ações recomendadas

Seja conciso e direto. Use emojis para destacar pontos importantes. NÃO use markdown com headers (#). Use apenas texto simples, emojis e quebras de linha.`;

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          messages: [{ role: "user", content: prompt }],
          context: "reports",
          stream: false
        }
      });

      if (error) throw error;

      // Parse the response - handle different response formats
      let content = "";
      
      if (typeof data === "string") {
        // If it's SSE format, parse it
        if (data.includes("data: ")) {
          const lines = data.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.slice(6));
                const delta = json.choices?.[0]?.delta?.content || json.choices?.[0]?.message?.content || "";
                content += delta;
              } catch {
                // skip unparseable lines
              }
            }
          }
        } else {
          content = data;
        }
      } else if (data?.choices?.[0]?.message?.content) {
        content = data.choices[0].message.content;
      } else if (data?.message) {
        content = data.message;
      } else if (data?.content) {
        content = data.content;
      } else if (data && typeof data === "object" && "body" in data) {
        // Handle streaming Response
        try {
          const reader = (data as Response).body?.getReader();
          if (reader) {
            const decoder = new TextDecoder();
            let rawText = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              rawText += decoder.decode(value, { stream: true });
            }
            // Parse SSE from raw text
            if (rawText.includes("data: ")) {
              const lines = rawText.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ") && line !== "data: [DONE]") {
                  try {
                    const json = JSON.parse(line.slice(6));
                    const delta = json.choices?.[0]?.delta?.content || json.choices?.[0]?.message?.content || "";
                    content += delta;
                  } catch {
                    // skip
                  }
                }
              }
            } else {
              content = rawText;
            }
          }
        } catch {
          content = "Erro ao processar resposta da IA.";
        }
      }
      
      setInsights(content || "Não foi possível gerar insights no momento. Tente novamente.");
      setHasGenerated(true);
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsights("Erro ao gerar insights. Verifique a conexão e tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate insights when metrics load
  useEffect(() => {
    if (metrics && !isLoading && !hasGenerated && metrics.totalLeads > 0) {
      generateInsights();
    }
  }, [metrics, isLoading]);

  // Reset when period changes
  useEffect(() => {
    setHasGenerated(false);
    setInsights("");
  }, [period.type, period.startDate, period.endDate]);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Insights da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.totalLeads === 0) {
    return (
      <Card className="bg-gradient-to-r from-muted/50 to-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            Insights da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Sem dados suficientes no período selecionado para gerar insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Insights da IA
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
                {isGenerating ? "Analisando..." : "Atualizar"}
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
            {isGenerating ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : insights ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {insights}
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={generateInsights}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Insights
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
