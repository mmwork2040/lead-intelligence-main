import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, Sparkles, CheckCircle, Link2, AlertCircle } from "lucide-react";
import { parseFile } from "@/lib/import/parseFile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  QuestionCategory,
  QuestionMapping,
  autoDetectMappings,
  getCategoryLabel,
  getCategoryColor,
  calculateDynamicScore,
  calculatePercentile,
  calculateLevelFromPercentile,
  getDefaultWeight,
} from "@/lib/mqlScore";

interface SurveyResponseImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string;
  surveyName: string;
}

function convertGoogleSheetsToCSV(url: string): string | null {
  const patterns = [
    /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /docs\.google\.com\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
    }
  }
  return null;
}

function parseCSVText(csvText: string): { data: any[]; headers: string[] } {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return { data: [], headers: [] };
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.replace(/^"|"$/g, "").trim());
  const data = lines.slice(1).map((line) => {
    const values = line.split(delimiter).map((v) => v.replace(/^"|"$/g, "").trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
  return { data, headers };
}

export function SurveyResponseImportDialog({
  open,
  onOpenChange,
  surveyId,
  surveyName,
}: SurveyResponseImportDialogProps) {
  const [step, setStep] = useState<"upload" | "mapping" | "importing" | "complete">("upload");
  const [importSource, setImportSource] = useState<"file" | "sheets">("file");
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState("");
  const [googleSheetsError, setGoogleSheetsError] = useState("");
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<QuestionMapping[]>([]);
  const [emailColumn, setEmailColumn] = useState<string>("");
  const [phoneColumn, setPhoneColumn] = useState<string>("");
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ imported: 0, skipped: 0, errors: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const queryClient = useQueryClient();

  const processHeaders = (newHeaders: string[]) => {
    setHeaders(newHeaders);
    const detectedMappings = autoDetectMappings(newHeaders);
    setMappings(detectedMappings);
    const emailCol = newHeaders.find((h) => /e-?mail/i.test(h));
    const phoneCol = newHeaders.find((h) => /telefone|phone|whatsapp|celular/i.test(h));
    if (emailCol) setEmailColumn(emailCol);
    if (phoneCol) setPhoneColumn(phoneCol);
  };

  const handleFileUpload = async (uploadedFile: File) => {
    try {
      const { data, headers } = await parseFile(uploadedFile);
      setParsedData(data);
      processHeaders(headers);
      setStep("mapping");
    } catch (error) {
      toast.error("Erro ao processar arquivo");
    }
  };

  const handleGoogleSheetsImport = async () => {
    setGoogleSheetsError("");
    setIsLoadingSheets(true);
    try {
      const csvUrl = convertGoogleSheetsToCSV(googleSheetsUrl);
      if (!csvUrl) {
        setGoogleSheetsError("URL inválida.");
        return;
      }
      const response = await fetch(csvUrl);
      if (!response.ok) {
        setGoogleSheetsError("Não foi possível acessar a planilha.");
        return;
      }
      const csvText = await response.text();
      const { data, headers } = parseCSVText(csvText);
      if (data.length === 0) {
        setGoogleSheetsError("Planilha vazia.");
        return;
      }
      setParsedData(data);
      processHeaders(headers);
      setStep("mapping");
      toast.success(`${data.length} linhas carregadas`);
    } catch (error) {
      setGoogleSheetsError("Erro ao acessar planilha.");
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileUpload(droppedFile);
  }, []);

  const updateMapping = (column: string, category: QuestionCategory) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.column === column ? { ...m, category, weight: getDefaultWeight(category) } : m
      )
    );
  };

  const handleImport = async () => {
    if (!emailColumn && !phoneColumn) {
      toast.error("Selecione email ou telefone para identificar leads");
      return;
    }

    setStep("importing");
    let imported = 0, skipped = 0, errors = 0;

    // Calculate all scores first for percentile
    const allScores = parsedData.map((row) => calculateDynamicScore(row, mappings).score);

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      setImportProgress(Math.round(((i + 1) / parsedData.length) * 100));

      try {
        const email = emailColumn ? row[emailColumn]?.toLowerCase().trim() : null;
        const phone = phoneColumn ? row[phoneColumn]?.replace(/\D/g, "") : null;

        let query = supabase.from("leads").select("lead_id, metadata");
        if (email && phone) {
          query = query.or(`email.ilike.${email},phone.ilike.%${phone}%`);
        } else if (email) {
          query = query.ilike("email", email);
        } else if (phone) {
          query = query.ilike("phone", `%${phone}%`);
        }

        const { data: leads } = await query.limit(1);
        if (!leads || leads.length === 0) { skipped++; continue; }

        const lead = leads[0];
        const { score, breakdown } = calculateDynamicScore(row, mappings);
        const percentile = calculatePercentile(score, allScores);
        const level = calculateLevelFromPercentile(percentile);

        const { error: responseError } = await supabase.from("survey_responses").insert({
          survey_id: surveyId,
          lead_id: lead.lead_id,
          answers: row,
        });

        if (responseError) { errors++; continue; }

        const currentMetadata = (lead.metadata as Record<string, any>) || {};
        await supabase.from("leads").update({
          metadata: {
            ...currentMetadata,
            mql: { score, level, percentile, breakdown, last_survey_at: new Date().toISOString() },
          },
        }).eq("lead_id", lead.lead_id);

        imported++;
      } catch { errors++; }
    }

    setImportResults({ imported, skipped, errors });
    setStep("complete");
    queryClient.invalidateQueries({ queryKey: ["survey_responses"] });
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  };

  const handleClose = () => {
    setStep("upload");
    setParsedData([]);
    setHeaders([]);
    setMappings([]);
    setEmailColumn("");
    setPhoneColumn("");
    setGoogleSheetsUrl("");
    setImportProgress(0);
    setImportResults({ imported: 0, skipped: 0, errors: 0 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Respostas - {surveyName}
          </DialogTitle>
          <DialogDescription>
            Importe respostas de pesquisa via arquivo CSV/Excel ou Google Sheets
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <Tabs value={importSource} onValueChange={(v) => setImportSource(v as "file" | "sheets")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="file"><Upload className="h-4 w-4 mr-2" />Upload</TabsTrigger>
              <TabsTrigger value="sheets"><Link2 className="h-4 w-4 mr-2" />Google Sheets</TabsTrigger>
            </TabsList>
            <TabsContent value="file">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center ${isDragging ? "border-primary bg-primary/5" : ""}`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">Arraste CSV ou Excel</p>
                <input type="file" accept=".csv,.xls,.xlsx" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" id="file-upload" />
                <label htmlFor="file-upload"><Button variant="outline" asChild><span>Selecionar Arquivo</span></Button></label>
              </div>
            </TabsContent>
            <TabsContent value="sheets" className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Google Sheets</Label>
                <Input placeholder="https://docs.google.com/spreadsheets/d/..." value={googleSheetsUrl} onChange={(e) => setGoogleSheetsUrl(e.target.value)} />
                {googleSheetsError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4" />{googleSheetsError}</p>}
              </div>
              <Button onClick={handleGoogleSheetsImport} disabled={!googleSheetsUrl || isLoadingSheets} className="w-full">
                {isLoadingSheets ? "Carregando..." : "Buscar Dados"}
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><span className="font-medium text-sm">Mapeamento inteligente - ajuste se necessário</span></div>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Select value={emailColumn || "__none__"} onValueChange={(v) => setEmailColumn(v === "__none__" ? "" : v)}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="__none__">Nenhum</SelectItem>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Telefone</Label><Select value={phoneColumn || "__none__"} onValueChange={(v) => setPhoneColumn(v === "__none__" ? "" : v)}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="__none__">Nenhum</SelectItem>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="border rounded-lg divide-y max-h-[250px] overflow-y-auto">
              {mappings.filter(m => m.column !== emailColumn && m.column !== phoneColumn).map(m => (
                <div key={m.column} className="p-3 flex items-center gap-3">
                  <span className="flex-1 text-sm truncate" title={m.column}>{m.column}</span>
                  <Select value={m.category} onValueChange={(v) => updateMapping(m.column, v as QuestionCategory)}>
                    <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="identifier">Identificador</SelectItem>
                      <SelectItem value="demographic">Demográfico</SelectItem>
                      <SelectItem value="income">Renda</SelectItem>
                      <SelectItem value="awareness">Consciência</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className={getCategoryColor(m.category)}>+{m.weight}</Badge>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>Voltar</Button>
              <Button onClick={handleImport}>Importar {parsedData.length} respostas</Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-primary animate-pulse mb-4" />
            <p className="font-medium">Importando...</p>
            <Progress value={importProgress} className="max-w-xs mx-auto mt-4" />
          </div>
        )}

        {step === "complete" && (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-[hsl(160,55%,40%)] dark:text-[#CCFF00] mb-4" />
            <h3 className="font-bold text-xl mb-4">Importação Concluída!</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] rounded-lg p-3"><div className="text-2xl font-bold text-[hsl(160,55%,40%)] dark:text-[#CCFF00]">{importResults.imported}</div><div className="text-xs">Importados</div></div>
              <div className="bg-yellow-500/10 rounded-lg p-3"><div className="text-2xl font-bold text-yellow-600">{importResults.skipped}</div><div className="text-xs">Não encontrados</div></div>
              <div className="bg-red-500/10 rounded-lg p-3"><div className="text-2xl font-bold text-red-600">{importResults.errors}</div><div className="text-xs">Erros</div></div>
            </div>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
