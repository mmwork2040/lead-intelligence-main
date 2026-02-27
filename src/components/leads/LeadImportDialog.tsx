import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { parseFile, validateParsedData, type ParsedFile } from "@/lib/import/parseFile";
import { detectColumnMapping, detectTagColumns, extractTagsFromRow } from "@/lib/import/detectColumns";
import { useCampaigns } from "@/hooks/useCampaigns";
import { getCampaignStatus, getCampaignStatusBadge } from "@/lib/translations";
import { ColumnMapper } from "./ColumnMapper";
import { TagSelector } from "./TagSelector";
import { AIColumnSuggestions } from "./AIColumnSuggestions";
import { useImportLeads, type ImportConfig } from "@/hooks/useImportLeads";
import { toast } from "sonner";

interface LeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "mapping" | "tags" | "confirm";

export const LeadImportDialog = ({ open, onOpenChange }: LeadImportDialogProps) => {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [tagColumns, setTagColumns] = useState<string[]>([]);
  const [useOriginalDate, setUseOriginalDate] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [detectedTags, setDetectedTags] = useState<{ name: string; count: number }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [defaultCrmStatus, setDefaultCrmStatus] = useState<string>("lead");
  const [defaultCampaignSlug, setDefaultCampaignSlug] = useState<string>("");

  const importMutation = useImportLeads();
  const { data: campaigns = [] } = useCampaigns();

  const handleFileUpload = async (uploadedFile: File) => {
    try {
      setFile(uploadedFile);
      
      const parsed = await parseFile(uploadedFile);
      const validation = validateParsedData(parsed);
      
      if (!validation.valid) {
        validation.errors.forEach((error) => toast.error(error));
        return;
      }

      setParsedData(parsed);

      // Detectar mapeamento automático
      const autoMapping = detectColumnMapping(parsed.headers);
      setMapping(autoMapping);

      // Detectar colunas de tags
      const autoTagColumns = detectTagColumns(parsed.headers, parsed.data.slice(0, 50));
      setTagColumns(autoTagColumns);

      // Extrair tags únicas do arquivo
      const tagCounts: Record<string, number> = {};
      parsed.data.forEach((row) => {
        const tags = extractTagsFromRow(row, autoTagColumns);
        tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const detected = Object.entries(tagCounts).map(([name, count]) => ({ name, count }));
      setDetectedTags(detected);
      
      // Selecionar todas as tags detectadas por padrão
      setSelectedTags(detected.map((t) => t.name));

      setStep("mapping");
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar arquivo");
    }
  };

  const handleNext = () => {
    if (step === "upload") setStep("mapping");
    else if (step === "mapping") setStep("tags");
    else if (step === "tags") setStep("confirm");
  };

  const handleBack = () => {
    if (step === "mapping") setStep("upload");
    else if (step === "tags") setStep("mapping");
    else if (step === "confirm") setStep("tags");
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    const droppedFile = files[0];
    const extension = droppedFile.name.split(".").pop()?.toLowerCase();
    
    if (!["csv", "xls", "xlsx"].includes(extension || "")) {
      toast.error("Formato não suportado. Use CSV ou Excel (.xlsx, .xls)");
      return;
    }
    
    await handleFileUpload(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleConfirm = async () => {
    if (!parsedData || !file) return;

    const config: ImportConfig = {
      mapping,
      useOriginalDate,
      selectedTags,
      newTags,
      tagColumns,
      defaultCrmStatus,
      campaignSlug: defaultCampaignSlug,
    };

    try {
      await importMutation.mutateAsync({
        data: parsedData.data,
        config,
        filename: file.name,
      });

      // Reset e fechar
      setStep("upload");
      setFile(null);
      setParsedData(null);
      setMapping({});
      setTagColumns([]);
      setSelectedTags([]);
      setNewTags([]);
      setDetectedTags([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const stepTitles = {
    upload: "Upload",
    mapping: "Mapeamento",
    tags: "Tags",
    confirm: "Confirmar",
  };

  const steps: Step[] = ["upload", "mapping", "tags", "confirm"];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Leads
            {parsedData && (
              <span className="text-sm text-muted-foreground font-normal">
                - {parsedData.totalRows} leads encontrados
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Importe leads de planilhas CSV ou Excel
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((s) => (
              <div
                key={s}
                className={`flex items-center gap-1 ${
                  s === step ? "text-foreground font-medium" : ""
                }`}
              >
                {steps.indexOf(s) < currentStepIndex && (
                  <CheckCircle2 className="h-3 w-3 text-success" />
                )}
                {stepTitles[s]}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="py-6">
          {step === "upload" && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onClick={() => document.getElementById("file-upload")?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <FileText className={`h-12 w-12 mx-auto mb-4 transition-colors ${
                  isDragging ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <p className="text-lg font-medium mb-2">
                  {isDragging ? 'Solte o arquivo aqui' : 'Arraste seu arquivo aqui'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Suporta: CSV, Excel (.xlsx, .xls) - máx 10MB, até 10.000 linhas
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">📋 Exemplo de formato:</p>
                <code className="text-xs block">
                  nome, email, telefone, data_cadastro, tags
                  <br />
                  João Silva, joao@email.com, 11999999999, 2024-01-15, vip
                </code>
              </div>
            </div>
          )}

          {step === "mapping" && parsedData && (
            <div className="space-y-6">
              {/* AI Analysis Section */}
              <AIColumnSuggestions
                headers={parsedData.headers}
                sampleData={parsedData.data}
                currentMapping={mapping}
                onApplySuggestions={setMapping}
              />

              <ColumnMapper
                headers={parsedData.headers}
                mapping={mapping}
                onMappingChange={setMapping}
                tagColumns={tagColumns}
                onTagColumnsChange={setTagColumns}
                previewData={parsedData.data}
                useOriginalDate={useOriginalDate}
                onUseOriginalDateChange={setUseOriginalDate}
              />

              <div className="border-t pt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Status CRM Padrão (para leads sem status definido)
                  </label>
                  <select
                    value={defaultCrmStatus}
                    onChange={(e) => setDefaultCrmStatus(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="lead">Lead Capturado</option>
                    <option value="engajado">Engajado</option>
                    <option value="aquecido">Aquecido</option>
                    <option value="carrinho">Carrinho</option>
                    <option value="comprador">Comprador</option>
                    <option value="perdido">Perdido</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Campanha Padrão (opcional, para leads sem campanha mapeada)
                  </label>
                  <select
                    value={defaultCampaignSlug}
                    onChange={(e) => setDefaultCampaignSlug(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="">Nenhuma campanha</option>
                    <option value={`vendas-mes-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}>
                      📅 Vendas do Mês ({new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })})
                    </option>
                    {campaigns.map((campaign) => {
                      const status = getCampaignStatus(campaign);
                      const badge = getCampaignStatusBadge(status);
                      return (
                        <option key={campaign.id} value={campaign.slug}>
                          {badge} {campaign.name}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Será aplicada apenas aos leads que não tiverem uma campanha mapeada
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === "tags" && (
            <TagSelector
              detectedTags={detectedTags}
              selectedTags={selectedTags}
              onSelectedTagsChange={setSelectedTags}
              newTags={newTags}
              onNewTagsChange={setNewTags}
            />
          )}

          {step === "confirm" && parsedData && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Resumo da Importação</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de leads</p>
                    <p className="text-2xl font-bold">{parsedData.totalRows}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Colunas mapeadas</p>
                    <p className="text-2xl font-bold">
                      {Object.values(mapping).filter((v) => v).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tags aplicadas</p>
                    <p className="text-2xl font-bold">
                      {selectedTags.length + newTags.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Colunas de tags</p>
                    <p className="text-2xl font-bold">{tagColumns.length}</p>
                  </div>
                  {Object.values(mapping).includes("purchase_product") && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">📦 Produtos</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Produtos não cadastrados serão criados automaticamente
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={step === "upload"}>
            Voltar
          </Button>
          <Button
            onClick={step === "confirm" ? handleConfirm : handleNext}
            disabled={(step === "upload" && !parsedData) || importMutation.isPending}
          >
            {importMutation.isPending ? "Importando..." : step === "confirm" ? "Importar" : "Próximo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
