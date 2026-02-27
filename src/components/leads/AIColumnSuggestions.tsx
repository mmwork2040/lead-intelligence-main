import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sparkles, CheckCircle2, AlertTriangle, Loader2, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIColumnSuggestionsProps {
  headers: string[];
  sampleData: Record<string, any>[];
  currentMapping: Record<string, string | null>;
  onApplySuggestions: (mapping: Record<string, string | null>) => void;
}

interface AISuggestion {
  column: string;
  suggestedField: string | null;
  confidence: "high" | "medium" | "low";
  reason: string;
}

interface AIAnalysis {
  suggestions: AISuggestion[];
  dataQualityIssues: string[];
  generalTips: string[];
}

export const AIColumnSuggestions = ({
  headers,
  sampleData,
  currentMapping,
  onApplySuggestions,
}: AIColumnSuggestionsProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  const analyzeWithAI = async () => {
    setIsAnalyzing(true);
    
    try {
      // Preparar dados para análise
      const samplePreview = sampleData.slice(0, 10).map(row => {
        const preview: Record<string, string> = {};
        headers.forEach(h => {
          preview[h] = String(row[h] || "").substring(0, 100);
        });
        return preview;
      });

      const prompt = `Você é um especialista em análise de dados e importação de leads para CRM.

Analise estas colunas de uma planilha e sugira o mapeamento correto para um sistema de CRM de leads.

COLUNAS DISPONÍVEIS:
${headers.join(", ")}

AMOSTRA DE DADOS (primeiras 10 linhas):
${JSON.stringify(samplePreview, null, 2)}

CAMPOS DO SISTEMA CRM:
- name: Nome completo do lead
- email: Email
- phone: Telefone (com DDD)
- ddd: DDD separado
- cpf: CPF do lead
- zip_code: CEP
- street: Rua/Logradouro
- street_number: Número
- complement: Complemento
- neighborhood: Bairro
- city: Cidade
- state: Estado (UF)
- country: País
- region: Região do Brasil
- gender: Gênero
- birth_date: Data de nascimento
- crm_status: Status no CRM (lead, engajado, aquecido, carrinho, comprador, perdido)
- source: Origem do lead
- project_slug: Campanha/Projeto
- utm_source, utm_campaign, utm_medium, utm_content, utm_term: Parâmetros UTM
- created_at: Data de cadastro
- tags: Tags/Categorias
- purchase_product: Produto comprado
- purchase_value: Valor da compra
- purchase_payment_method: Método de pagamento
- purchase_status: Status do pagamento
- purchase_date: Data da compra

Responda APENAS com um JSON válido no formato:
{
  "suggestions": [
    {
      "column": "nome da coluna original",
      "suggestedField": "campo do sistema ou null para ignorar",
      "confidence": "high" | "medium" | "low",
      "reason": "breve explicação"
    }
  ],
  "dataQualityIssues": ["lista de problemas encontrados nos dados"],
  "generalTips": ["dicas gerais para melhorar a importação"]
}`;

      const response = await supabase.functions.invoke("ai-assistant", {
        body: { 
          message: prompt,
          context: "import_analysis"
        },
      });

      if (response.error) throw new Error(response.error.message);

      // Parse da resposta (pode vir como string ou já objeto)
      let analysisResult: AIAnalysis;
      
      const content = response.data?.content || response.data;
      
      // Tenta extrair JSON da resposta
      const jsonMatch = typeof content === "string" 
        ? content.match(/\{[\s\S]*\}/) 
        : null;
      
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else if (typeof content === "object" && content.suggestions) {
        analysisResult = content;
      } else {
        throw new Error("Resposta da IA não está no formato esperado");
      }

      setAnalysis(analysisResult);
      toast.success("Análise concluída!");
      
    } catch (error: any) {
      console.error("Erro na análise IA:", error);
      toast.error("Erro ao analisar planilha com IA");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestions = () => {
    if (!analysis) return;

    const newMapping: Record<string, string | null> = { ...currentMapping };
    
    analysis.suggestions.forEach(suggestion => {
      if (suggestion.confidence === "high" || suggestion.confidence === "medium") {
        newMapping[suggestion.column] = suggestion.suggestedField;
      }
    });

    onApplySuggestions(newMapping);
    toast.success("Sugestões aplicadas!");
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <Badge className="bg-[rgba(16,185,129,0.12)] dark:bg-[rgba(204,255,0,0.08)] text-[hsl(160,55%,40%)] dark:text-[#CCFF00] border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)]">Alta</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Média</Badge>;
      case "low":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Baixa</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Assistente IA</h3>
        </div>
        
        <Button
          onClick={analyzeWithAI}
          disabled={isAnalyzing}
          size="sm"
          variant={analysis ? "outline" : "default"}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : analysis ? (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Reanalisar
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analisar com IA
            </>
          )}
        </Button>
      </div>

      {!analysis && !isAnalyzing && (
        <p className="text-sm text-muted-foreground">
          A IA pode analisar sua planilha e sugerir o mapeamento correto das colunas automaticamente.
        </p>
      )}

      {isAnalyzing && (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Analisando planilha...</p>
            <p className="text-xs text-muted-foreground">
              A IA está identificando padrões e sugerindo mapeamentos
            </p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          {/* Sugestões de mapeamento */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
              Sugestões de Mapeamento
            </h4>
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {analysis.suggestions.slice(0, 8).map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm bg-background/50 rounded p-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {suggestion.column}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">
                      {suggestion.suggestedField || "Ignorar"}
                    </span>
                  </div>
                  {getConfidenceBadge(suggestion.confidence)}
                </div>
              ))}
            </div>
            <Button onClick={applySuggestions} size="sm" className="w-full mt-2">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aplicar Sugestões
            </Button>
          </div>

          {/* Problemas de qualidade */}
          {analysis.dataQualityIssues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Problemas Encontrados
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {analysis.dataQualityIssues.slice(0, 3).map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-500">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dicas */}
          {analysis.generalTips.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Dicas
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {analysis.generalTips.slice(0, 2).map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
