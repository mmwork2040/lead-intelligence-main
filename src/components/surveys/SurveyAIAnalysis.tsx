import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Users, Target, Lightbulb, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSurveyResponses } from "@/hooks/useSurveyResponses";

interface SurveyAIAnalysisProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string;
  surveyName: string;
}

interface AIAnalysisResult {
  resumoExecutivo: string;
  perfilPredominante: string[];
  nivelConsciencia: string[];
  insights: string[];
  recomendacoes: string[];
}

export function SurveyAIAnalysis({
  open,
  onOpenChange,
  surveyId,
  surveyName,
}: SurveyAIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const { data: responses } = useSurveyResponses(surveyId);

  const analyzeWithAI = async () => {
    if (!responses || responses.length === 0) {
      toast.error("Nenhuma resposta encontrada para analisar");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Prepare responses data for AI
      const responsesData = responses.map(r => ({
        answers: r.answers,
        created_at: r.created_at,
      }));

      const prompt = `Analise estas ${responses.length} respostas de pesquisa MQL (Marketing Qualified Lead) para qualificação de leads.

As respostas coletam dados sobre:
- Dados demográficos (idade, profissão, escolaridade)
- Faixa de renda e capacidade de investimento
- Nível de consciência e prontidão para compra

RESPOSTAS:
${JSON.stringify(responsesData, null, 2)}

Retorne a análise em formato JSON com esta estrutura exata:
{
  "resumoExecutivo": "Resumo de 2-3 linhas sobre os principais achados",
  "perfilPredominante": ["3-4 características do perfil típico dos leads"],
  "nivelConsciencia": ["3-4 insights sobre o nível de awareness e prontidão"],
  "insights": ["3-5 insights acionáveis sobre padrões encontrados"],
  "recomendacoes": ["3-5 recomendações práticas para conversão"]
}

Seja específico com números e percentuais quando possível.`;

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { 
          messages: [{ role: "user", content: prompt }],
          context: "survey_analysis"
        },
      });

      if (error) throw error;

      // Parse the AI response
      const responseText = data?.choices?.[0]?.message?.content || data?.content || "";
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedAnalysis = JSON.parse(jsonMatch[0]);
        setAnalysis(parsedAnalysis);
      } else {
        // Fallback if no JSON found
        setAnalysis({
          resumoExecutivo: "Análise concluída. " + responseText.substring(0, 200),
          perfilPredominante: ["Dados sendo processados"],
          nivelConsciencia: ["Avaliando níveis de consciência"],
          insights: ["Processando insights"],
          recomendacoes: ["Gerando recomendações"],
        });
      }
    } catch (error) {
      console.error("AI Analysis error:", error);
      toast.error("Erro ao analisar respostas com IA");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Análise IA - {surveyName}
          </DialogTitle>
        </DialogHeader>

        {!analysis && !isAnalyzing && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Análise Inteligente de MQL</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              A IA vai analisar {responses?.length || 0} respostas para identificar padrões, 
              perfis predominantes e gerar recomendações de conversão.
            </p>
            <Button onClick={analyzeWithAI} className="gap-2" disabled={!responses?.length}>
              <Sparkles className="w-4 h-4" />
              Iniciar Análise
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Analisando respostas...</h3>
            <p className="text-sm text-muted-foreground">
              Processando {responses?.length} respostas com IA
            </p>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Resumo Executivo */}
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Resumo Executivo</h4>
                  <p className="text-sm text-muted-foreground">{analysis.resumoExecutivo}</p>
                </div>
              </div>
            </Card>

            {/* Perfil Predominante */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Perfil Predominante</h4>
              </div>
              <div className="space-y-2">
                {analysis.perfilPredominante.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge variant="secondary" className="mt-0.5">👤</Badge>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Nível de Consciência */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Nível de Consciência</h4>
              </div>
              <div className="space-y-2">
                {analysis.nivelConsciencia.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge variant="secondary" className="mt-0.5">🎯</Badge>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Insights */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Insights</h4>
              </div>
              <div className="space-y-2">
                {analysis.insights.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge 
                      variant="outline" 
                      className={
                        item.includes("✅") ? "bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] text-[hsl(160,55%,40%)] dark:text-[#CCFF00] border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)]" :
                        item.includes("⚠️") ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                        "bg-primary/10 text-primary border-primary/20"
                      }
                    >
                      {item.includes("✅") ? "✅" : item.includes("⚠️") ? "⚠️" : "📊"}
                    </Badge>
                    <span className="text-sm">{item.replace(/^[✅⚠️📊]\s*/, "")}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recomendações */}
            <Card className="p-4 border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)] bg-[rgba(16,185,129,0.05)] dark:bg-[rgba(204,255,0,0.05)]">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
                <h4 className="font-semibold">Recomendações</h4>
              </div>
              <div className="space-y-2">
                {analysis.recomendacoes.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[hsl(160,55%,40%)] dark:text-[#CCFF00] font-bold">{i + 1}.</span>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAnalysis(null)}>
                Nova Análise
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
