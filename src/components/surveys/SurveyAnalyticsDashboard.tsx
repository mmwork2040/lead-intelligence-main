import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BarChart3, Users, TrendingUp, Sparkles, Download, X } from "lucide-react";
import { SurveyChartsGrid } from "./SurveyChartsGrid";
import { SurveyRankingTable } from "./SurveyRankingTable";
import { SurveyPatternsAnalysis } from "./SurveyPatternsAnalysis";
import { useSurveyResponses } from "@/hooks/useSurveyResponses";
import { exportSurveyResponsesToCSV } from "@/lib/export/exportSurveyResponses";
import {
  autoDetectMappings,
  calculateDynamicScore,
  calculatePercentile,
  calculateLevelFromPercentile,
} from "@/lib/mqlScore";

interface SurveyAnalyticsDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string;
  surveyName: string;
}

export function SurveyAnalyticsDashboard({
  open,
  onOpenChange,
  surveyId,
  surveyName,
}: SurveyAnalyticsDashboardProps) {
  const { data: responses = [], isLoading } = useSurveyResponses(surveyId);

  // Extrair perguntas das respostas
  const questions = useMemo(() => {
    if (responses.length === 0) return [];
    
    const allKeys = new Set<string>();
    responses.forEach((response) => {
      const answers = response.answers as Record<string, any>;
      Object.keys(answers).forEach((key) => allKeys.add(key));
    });
    
    return Array.from(allKeys).filter(
      (key) => !["lead_id", "survey_id", "id", "created_at"].includes(key)
    );
  }, [responses]);

  // Calcular métricas de overview
  const overviewStats = useMemo(() => {
    if (responses.length === 0 || questions.length === 0) {
      return {
        total: 0,
        avgScore: 0,
        qualified: 0,
        hot: 0,
        warm: 0,
        cold: 0,
        readyPercentage: 0,
      };
    }

    const mappings = autoDetectMappings(questions);
    
    const scoredResponses = responses.map((response) => {
      const answers = response.answers as Record<string, any>;
      const { score } = calculateDynamicScore(answers, mappings);
      return { ...response, score };
    });

    const allScores = scoredResponses.map((r) => r.score);
    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

    const counts = { qualified: 0, hot: 0, warm: 0, cold: 0 };
    scoredResponses.forEach((r) => {
      const percentile = calculatePercentile(r.score, allScores);
      const level = calculateLevelFromPercentile(percentile);
      counts[level]++;
    });

    return {
      total: responses.length,
      avgScore,
      ...counts,
      readyPercentage: Math.round(((counts.qualified + counts.hot) / responses.length) * 100),
    };
  }, [responses, questions]);

  const handleExport = () => {
    if (responses.length === 0) return;
    
    const mappings = autoDetectMappings(questions);
    
    // Prepare data for export
    const allScores = responses.map((r) => {
      const answers = r.answers as Record<string, any>;
      const { score } = calculateDynamicScore(answers, mappings);
      return score;
    });
    
    const exportData = responses.map((response) => {
      const answers = response.answers as Record<string, any>;
      const { score } = calculateDynamicScore(answers, mappings);
      const percentile = calculatePercentile(score, allScores);
      const level = calculateLevelFromPercentile(percentile);
      
      const levelLabels: Record<string, string> = {
        qualified: "Qualificado",
        hot: "Quente",
        warm: "Morno",
        cold: "Frio",
      };
      
      return {
        leadName: response.leads?.name || "Sem nome",
        leadEmail: response.leads?.email || "",
        leadPhone: response.leads?.phone || "",
        answers,
        score,
        level: levelLabels[level] || level,
        percentile,
        createdAt: response.created_at ? new Date(response.created_at).toLocaleDateString("pt-BR") : "",
      };
    });
    
    exportSurveyResponsesToCSV(exportData, surveyName, questions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{surveyName}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Dashboard de análise com {overviewStats.total} respostas
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : responses.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma resposta ainda</h3>
                  <p className="text-sm text-muted-foreground">
                    Importe respostas de uma planilha para ver a análise.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Overview Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-5">
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">{overviewStats.total}</p>
                          <p className="text-xs text-muted-foreground">Respostas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-secondary" />
                        <div>
                          <p className="text-2xl font-bold">{overviewStats.avgScore.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">Score Médio</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)] bg-[rgba(16,185,129,0.05)] dark:bg-[rgba(204,255,0,0.05)]">
                    <CardContent className="p-4">
                      <div>
                        <p className="text-2xl font-bold text-[hsl(160,55%,40%)] dark:text-[#CCFF00]">
                          {overviewStats.readyPercentage}%
                        </p>
                        <p className="text-xs text-muted-foreground">Prontos p/ Venda</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {overviewStats.qualified}
                        </p>
                        <p className="text-xs text-muted-foreground">Qualificados</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-500/30 bg-orange-500/5">
                    <CardContent className="p-4">
                      <div>
                        <p className="text-2xl font-bold text-orange-500">
                          {overviewStats.hot}
                        </p>
                        <p className="text-xs text-muted-foreground">Quentes</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="charts" className="w-full">
                  <ScrollArea className="w-full">
                    <TabsList className="mb-6 inline-flex w-auto">
                      <TabsTrigger value="charts" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Gráficos
                      </TabsTrigger>
                      <TabsTrigger value="ranking" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Ranking
                      </TabsTrigger>
                      <TabsTrigger value="patterns" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Padrões IA
                      </TabsTrigger>
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>

                  <TabsContent value="charts" className="mt-0">
                    <SurveyChartsGrid responses={responses} questions={questions} />
                  </TabsContent>

                  <TabsContent value="ranking" className="mt-0">
                    <SurveyRankingTable responses={responses} questions={questions} />
                  </TabsContent>

                  <TabsContent value="patterns" className="mt-0">
                    <SurveyPatternsAnalysis
                      responses={responses}
                      questions={questions}
                      surveyName={surveyName}
                    />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
