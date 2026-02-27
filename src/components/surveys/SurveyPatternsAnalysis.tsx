import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, Users, Target, Lightbulb, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  autoDetectMappings,
  calculateDynamicScore,
  calculatePercentile,
  calculateLevelFromPercentile,
} from "@/lib/mqlScore";

interface SurveyPatternsAnalysisProps {
  responses: any[];
  questions: string[];
  surveyName: string;
}

interface PatternResult {
  executiveSummary: string;
  predominantProfile: string;
  topPatterns: Array<{ pattern: string; frequency: string; impact: string }>;
  correlations: Array<{ finding: string; recommendation: string }>;
  actionableInsights: string[];
  warnings: string[];
}

export function SurveyPatternsAnalysis({
  responses,
  questions,
  surveyName,
}: SurveyPatternsAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PatternResult | null>(null);

  // Calcular estatísticas básicas
  const stats = useMemo(() => {
    if (responses.length === 0 || questions.length === 0) {
      return null;
    }

    const mappings = autoDetectMappings(questions);
    
    const scoredResponses = responses.map((response) => {
      const answers = response.answers as Record<string, any>;
      const { score } = calculateDynamicScore(answers, mappings);
      return { ...response, score };
    });

    const allScores = scoredResponses.map((r) => r.score);
    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

    const levelCounts = { qualified: 0, hot: 0, warm: 0, cold: 0 };
    scoredResponses.forEach((r) => {
      const percentile = calculatePercentile(r.score, allScores);
      const level = calculateLevelFromPercentile(percentile);
      levelCounts[level]++;
    });

    // Encontrar respostas mais frequentes por pergunta
    const frequentAnswers: Record<string, { answer: string; count: number }> = {};
    questions.forEach((q) => {
      const answerCounts: Record<string, number> = {};
      responses.forEach((r) => {
        const answer = r.answers[q];
        if (answer) {
          const key = String(answer);
          answerCounts[key] = (answerCounts[key] || 0) + 1;
        }
      });
      const sorted = Object.entries(answerCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        frequentAnswers[q] = { answer: sorted[0][0], count: sorted[0][1] };
      }
    });

    return {
      totalResponses: responses.length,
      avgScore,
      levelCounts,
      frequentAnswers,
    };
  }, [responses, questions]);

  const analyzeWithAI = async () => {
    if (!stats) return;

    setIsAnalyzing(true);
    try {
      // Preparar dados para análise
      const responsesSample = responses.slice(0, 50).map((r) => r.answers);
      
      const prompt = `Analise as respostas desta pesquisa de qualificação de leads chamada "${surveyName}".

PERGUNTAS DA PESQUISA:
${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

ESTATÍSTICAS GERAIS:
- Total de respostas: ${stats.totalResponses}
- Score médio: ${stats.avgScore.toFixed(1)}
- Distribuição: ${stats.levelCounts.qualified} qualificados, ${stats.levelCounts.hot} quentes, ${stats.levelCounts.warm} mornos, ${stats.levelCounts.cold} frios

RESPOSTAS MAIS FREQUENTES POR PERGUNTA:
${Object.entries(stats.frequentAnswers)
  .map(([q, data]) => `- "${q}": "${data.answer}" (${data.count} respostas, ${Math.round((data.count / stats.totalResponses) * 100)}%)`)
  .join("\n")}

AMOSTRA DE RESPOSTAS (${responsesSample.length} de ${responses.length}):
${JSON.stringify(responsesSample, null, 2)}

Retorne a análise em JSON com esta estrutura EXATA:
{
  "executiveSummary": "Resumo executivo em 2-3 frases sobre o perfil geral dos respondentes e nível de prontidão para vendas",
  "predominantProfile": "Descrição do perfil predominante baseado nas respostas mais frequentes",
  "topPatterns": [
    {"pattern": "Padrão identificado 1", "frequency": "X%", "impact": "alto/médio/baixo"},
    {"pattern": "Padrão identificado 2", "frequency": "X%", "impact": "alto/médio/baixo"}
  ],
  "correlations": [
    {"finding": "Descoberta de correlação entre respostas", "recommendation": "Ação recomendada"},
    {"finding": "Outra descoberta", "recommendation": "Outra ação"}
  ],
  "actionableInsights": [
    "Insight acionável 1 para equipe de vendas",
    "Insight acionável 2",
    "Insight acionável 3"
  ],
  "warnings": [
    "Alerta ou ponto de atenção se houver"
  ]
}`;

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { message: prompt },
      });

      if (error) throw error;

      const responseText = data.response || data.message || "";
      
      // Extrair JSON da resposta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as PatternResult;
        setAnalysis(parsed);
        toast.success("Análise de padrões concluída!");
      } else {
        throw new Error("Formato de resposta inválido");
      }
    } catch (error) {
      console.error("Erro na análise:", error);
      toast.error("Erro ao analisar padrões");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!stats) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhuma resposta disponível para análise.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold">{stats.totalResponses}</p>
            <p className="text-xs text-muted-foreground">Respostas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Target className="mx-auto mb-2 h-6 w-6 text-secondary" />
            <p className="text-2xl font-bold">{stats.avgScore.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Score Médio</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto mb-2 h-6 w-6 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
            <p className="text-2xl font-bold">
              {Math.round(((stats.levelCounts.qualified + stats.levelCounts.hot) / stats.totalResponses) * 100)}%
            </p>
            <p className="text-xs text-muted-foreground">Prontos p/ Venda</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
            <p className="text-2xl font-bold">{questions.length}</p>
            <p className="text-xs text-muted-foreground">Perguntas</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Button */}
      {!analysis && (
        <Card className="border-dashed border-primary/50">
          <CardContent className="py-8 text-center">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary/50" />
            <h3 className="mb-2 text-lg font-semibold">Análise de Padrões com IA</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Descubra correlações, perfis predominantes e insights acionáveis para sua equipe de vendas.
            </p>
            <Button onClick={analyzeWithAI} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analisar Padrões
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-primary" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.executiveSummary}</p>
            </CardContent>
          </Card>

          {/* Predominant Profile */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-secondary" />
                Perfil Predominante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.predominantProfile}</p>
            </CardContent>
          </Card>

          {/* Patterns */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
                Padrões Identificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.topPatterns.map((pattern, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-border/50 p-3"
                  >
                    <Badge
                      variant="outline"
                      className={
                        pattern.impact === "alto"
                          ? "border-[hsl(160,55%,40%)] dark:border-[#CCFF00] text-[hsl(160,55%,40%)] dark:text-[#CCFF00]"
                          : pattern.impact === "médio"
                          ? "border-yellow-500 text-yellow-500"
                          : "border-muted-foreground text-muted-foreground"
                      }
                    >
                      {pattern.frequency}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{pattern.pattern}</p>
                      <p className="text-xs text-muted-foreground">
                        Impacto: {pattern.impact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Correlations */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Correlações e Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.correlations.map((corr, i) => (
                  <div key={i} className="border-l-2 border-primary/50 pl-4">
                    <p className="text-sm font-medium">{corr.finding}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      → {corr.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actionable Insights */}
          <Card className="border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)] bg-[rgba(16,185,129,0.05)] dark:bg-[rgba(204,255,0,0.05)]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
                Insights Acionáveis para Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.actionableInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(160,55%,40%)] dark:bg-[#CCFF00]" />
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Warnings */}
          {analysis.warnings.length > 0 && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Pontos de Atenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.warnings.map((warning, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Analyze Again */}
          <div className="text-center">
            <Button variant="outline" onClick={analyzeWithAI} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Nova Análise
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
