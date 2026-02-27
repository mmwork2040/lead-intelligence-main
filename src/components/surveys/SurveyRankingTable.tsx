import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Flame, ThermometerSun, Snowflake, Star, TrendingUp } from "lucide-react";
import {
  calculateDynamicScore,
  autoDetectMappings,
  calculatePercentile,
  calculateLevelFromPercentile,
  type MQLLevel,
} from "@/lib/mqlScore";

interface SurveyRankingTableProps {
  responses: any[];
  questions: string[];
}

const levelConfig: Record<MQLLevel, { label: string; icon: React.ReactNode; className: string }> = {
  qualified: {
    label: "Qualificado",
    icon: <Star className="h-3.5 w-3.5" />,
    className: "bg-primary/20 text-primary border-primary/30",
  },
  hot: {
    label: "Quente",
    icon: <Flame className="h-3.5 w-3.5" />,
    className: "bg-[rgba(16,185,129,0.10)] text-[hsl(160,55%,40%)] dark:bg-[rgba(204,255,0,0.08)] dark:text-[#CCFF00] border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)]",
  },
  warm: {
    label: "Morno",
    icon: <ThermometerSun className="h-3.5 w-3.5" />,
    className: "bg-[rgba(245,158,11,0.12)] text-[hsl(38,92%,45%)] dark:text-[hsl(45,100%,55%)] border-[rgba(245,158,11,0.20)]",
  },
  cold: {
    label: "Frio",
    icon: <Snowflake className="h-3.5 w-3.5" />,
    className: "bg-muted/60 text-muted-foreground border-border",
  },
};

export function SurveyRankingTable({ responses, questions }: SurveyRankingTableProps) {
  const rankedData = useMemo(() => {
    if (responses.length === 0 || questions.length === 0) return [];

    const mappings = autoDetectMappings(questions);

    // Calcular scores para todas as respostas
    const scoredResponses = responses.map((response) => {
      const answers = response.answers as Record<string, any>;
      const { score, breakdown } = calculateDynamicScore(answers, mappings);
      
      return {
        ...response,
        score,
        breakdown,
        leadName: response.leads?.name || "Sem nome",
        leadEmail: response.leads?.email || "Sem email",
        leadPhone: response.leads?.phone || "",
      };
    });

    // Calcular percentis
    const allScores = scoredResponses.map((r) => r.score);
    
    const rankedResponses = scoredResponses.map((response) => {
      const percentile = calculatePercentile(response.score, allScores);
      const level = calculateLevelFromPercentile(percentile);
      
      return {
        ...response,
        percentile,
        level,
      };
    });

    // Ordenar por score decrescente
    return rankedResponses.sort((a, b) => b.score - a.score);
  }, [responses, questions]);

  const levelCounts = useMemo(() => {
    const counts: Record<MQLLevel, number> = {
      qualified: 0,
      hot: 0,
      warm: 0,
      cold: 0,
    };
    rankedData.forEach((r) => {
      counts[r.level]++;
    });
    return counts;
  }, [rankedData]);

  if (rankedData.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhuma resposta para rankear.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(Object.keys(levelConfig) as MQLLevel[]).map((level) => {
          const config = levelConfig[level];
          const count = levelCounts[level];
          const percentage = Math.round((count / rankedData.length) * 100);
          
          return (
            <Card key={level} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className={`rounded-full p-1.5 ${config.className}`}>
                    {config.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.label} ({percentage}%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top 10 Highlight */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top 10 Leads Mais Prontos para Venda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {rankedData.slice(0, 10).map((lead, index) => (
              <div
                key={lead.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-sm">{lead.leadName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.leadEmail}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{lead.score.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">
                    Top {lead.percentile.toFixed(0)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Ranking Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ranking Completo de Prontidão</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">#</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Percentil</TableHead>
                  <TableHead className="text-center">Nível</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedData.map((lead, index) => {
                  const config = levelConfig[lead.level];
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="text-center font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.leadName}</p>
                          <p className="text-xs text-muted-foreground">
                            {lead.leadEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold">{lead.score.toFixed(0)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-muted-foreground">
                          Top {lead.percentile.toFixed(0)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`gap-1 ${config.className}`}
                        >
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
