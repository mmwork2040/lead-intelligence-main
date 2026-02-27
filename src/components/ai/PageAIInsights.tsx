import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PageAIInsightsProps {
  title?: string;
  prompt: string;
  context: string;
  canGenerate: boolean;
  isLoading?: boolean;
  /** Reset insights when these values change */
  resetKeys?: any[];
}

export function PageAIInsights({
  title = "Insights de IA",
  prompt,
  context,
  canGenerate,
  isLoading,
  resetKeys = [],
}: PageAIInsightsProps) {
  const [insights, setInsights] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsights = useCallback(async () => {
    if (isLoading || !canGenerate) return;

    setIsGenerating(true);
    setInsights("");

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          context,
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
      setInsights(
        "Erro ao gerar insights. O administrador precisa configurar a chave de API em Configurações > Inteligência Artificial."
      );
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, context, isLoading, canGenerate]);

  // Reset when keys change (use JSON.stringify to stabilize the dependency)
  const resetKeysStr = JSON.stringify(resetKeys);
  useEffect(() => {
    setHasGenerated(false);
    setInsights("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKeysStr]);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!canGenerate) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              {title}
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
                Clique em "Gerar Insights" para análise de IA dos seus dados.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
