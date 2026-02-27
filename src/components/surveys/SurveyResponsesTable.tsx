import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSurveyResponses } from "@/hooks/useSurveyResponses";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowUpDown, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportSurveyResponsesToCSV, exportSurveyResponsesToExcel } from "@/lib/export/exportSurveyResponses";
import { calculateDynamicScore, calculatePercentile, calculateLevelFromPercentile, autoDetectMappings } from "@/lib/mqlScore";
import { getMQLLevelLabel, getMQLLevelColor, getMQLLevelIcon } from "@/hooks/useLeadScore";

interface SurveyResponsesTableProps {
  surveyId: string;
  surveyName?: string;
}

export function SurveyResponsesTable({ surveyId, surveyName = "Pesquisa" }: SurveyResponsesTableProps) {
  const { data: responses, isLoading } = useSurveyResponses(surveyId);
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  // Extract unique questions from all responses
  const questions = useMemo(() => {
    if (!responses || responses.length === 0) return [];
    const allKeys = new Set<string>();
    responses.forEach((r: any) => {
      if (r.answers && typeof r.answers === "object") {
        Object.keys(r.answers).forEach((k) => allKeys.add(k));
      }
    });
    return Array.from(allKeys).filter(
      (k) => !["email", "e-mail", "telefone", "phone", "whatsapp", "nome", "name"].some(
        (id) => k.toLowerCase().includes(id)
      )
    );
  }, [responses]);

  // Auto-detect mappings
  const mappings = useMemo(() => autoDetectMappings(questions), [questions]);

  // Calculate scores and percentiles
  const processedResponses = useMemo(() => {
    if (!responses || responses.length === 0) return [];

    // Calculate all scores first
    const withScores = responses.map((r: any) => {
      const { score, breakdown } = calculateDynamicScore(r.answers || {}, mappings);
      return {
        ...r,
        mqlScore: score,
        breakdown,
      };
    });

    // Calculate percentiles
    const allScores = withScores.map((r) => r.mqlScore);
    const withPercentiles = withScores.map((r) => {
      const percentile = calculatePercentile(r.mqlScore, allScores);
      const level = calculateLevelFromPercentile(percentile);
      return {
        ...r,
        percentile,
        mqlLevel: level,
      };
    });

    return withPercentiles;
  }, [responses, mappings]);

  // Filter and sort
  const filteredResponses = useMemo(() => {
    let result = [...processedResponses];

    // Filter by level
    if (filterLevel !== "all") {
      result = result.filter((r) => r.mqlLevel === filterLevel);
    }

    // Sort
    if (sortBy === "score") {
      result.sort((a, b) => b.mqlScore - a.mqlScore);
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [processedResponses, filterLevel, sortBy]);

  const handleExportCSV = () => {
    const exportData = filteredResponses.map((r) => ({
      leadName: r.leads?.name || "-",
      leadEmail: r.leads?.email || "-",
      leadPhone: r.leads?.phone || "-",
      answers: r.answers || {},
      score: r.mqlScore,
      level: getMQLLevelLabel(r.mqlLevel),
      percentile: r.percentile,
      createdAt: format(new Date(r.created_at), "dd/MM/yyyy HH:mm"),
    }));
    exportSurveyResponsesToCSV(exportData, surveyName, questions);
  };

  const handleExportExcel = () => {
    const exportData = filteredResponses.map((r) => ({
      leadName: r.leads?.name || "-",
      leadEmail: r.leads?.email || "-",
      leadPhone: r.leads?.phone || "-",
      answers: r.answers || {},
      score: r.mqlScore,
      level: getMQLLevelLabel(r.mqlLevel),
      percentile: r.percentile,
      createdAt: format(new Date(r.created_at), "dd/MM/yyyy HH:mm"),
    }));
    exportSurveyResponsesToExcel(exportData, surveyName, questions);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!responses || responses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma resposta registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "score")}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Ordenar por Data</SelectItem>
              <SelectItem value="score">Ordenar por Score</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="qualified">🔥 Qualificado</SelectItem>
              <SelectItem value="hot">🟢 Quente</SelectItem>
              <SelectItem value="warm">🟡 Morno</SelectItem>
              <SelectItem value="cold">🔵 Frio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold">{processedResponses.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="bg-orange-500/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {processedResponses.filter((r) => r.mqlLevel === "qualified").length}
          </div>
          <div className="text-xs text-muted-foreground">Qualificados</div>
        </div>
        <div className="bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-[hsl(160,55%,40%)] dark:text-[#CCFF00]">
            {processedResponses.filter((r) => r.mqlLevel === "hot").length}
          </div>
          <div className="text-xs text-muted-foreground">Quentes</div>
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {processedResponses.filter((r) => r.mqlLevel === "warm").length}
          </div>
          <div className="text-xs text-muted-foreground">Mornos</div>
        </div>
        <div className="bg-muted/60 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-muted-foreground">
            {processedResponses.filter((r) => r.mqlLevel === "cold").length}
          </div>
          <div className="text-xs text-muted-foreground">Frios</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Lead</TableHead>
              <TableHead className="min-w-[100px]">Score</TableHead>
              <TableHead className="min-w-[100px]">Nível</TableHead>
              {questions.slice(0, 4).map((q) => (
                <TableHead key={q} className="min-w-[150px] max-w-[200px]" title={q}>
                  {q.length > 25 ? q.slice(0, 25) + "..." : q}
                </TableHead>
              ))}
              <TableHead className="min-w-[120px]">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResponses.map((response: any) => (
              <TableRow key={response.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{response.leads?.name || "-"}</div>
                    <div className="text-xs text-muted-foreground">{response.leads?.email || "-"}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{response.mqlScore}</span>
                    <span className="text-xs text-muted-foreground">
                      Top {Math.round(100 - response.percentile)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getMQLLevelColor(response.mqlLevel)}>
                    {getMQLLevelIcon(response.mqlLevel)} {getMQLLevelLabel(response.mqlLevel)}
                  </Badge>
                </TableCell>
                {questions.slice(0, 4).map((q) => (
                  <TableCell key={q} className="max-w-[200px] truncate" title={response.answers?.[q] || "-"}>
                    {response.answers?.[q] || "-"}
                  </TableCell>
                ))}
                <TableCell>{format(new Date(response.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
