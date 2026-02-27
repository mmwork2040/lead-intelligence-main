import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Trash2, Edit, Upload, Sparkles, MessageSquare, BarChart3 } from "lucide-react";
import { useSurveys, useDeleteSurvey, Survey } from "@/hooks/useSurveys";
import { useSurveyResponses } from "@/hooks/useSurveyResponses";
import { SurveyDialog } from "@/components/surveys/SurveyDialog";
import { SurveyResponsesTable } from "@/components/surveys/SurveyResponsesTable";
import { SurveyResponseImportDialog } from "@/components/surveys/SurveyResponseImportDialog";
import { SurveyAIAnalysis } from "@/components/surveys/SurveyAIAnalysis";
import { SurveyAnalyticsDashboard } from "@/components/surveys/SurveyAnalyticsDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { PeriodFilter } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";

export default function Surveys() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null);
  const [responsesDialogOpen, setResponsesDialogOpen] = useState(false);
  const [viewingSurveyId, setViewingSurveyId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>({ type: "30d" });
  
  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importingSurvey, setImportingSurvey] = useState<{ id: string; name: string } | null>(null);
  
  // AI Analysis dialog state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [analyzingSurvey, setAnalyzingSurvey] = useState<{ id: string; name: string } | null>(null);
  
  // Analytics dashboard state
  const [analyticsDashboardOpen, setAnalyticsDashboardOpen] = useState(false);
  const [analyticsSurvey, setAnalyticsSurvey] = useState<{ id: string; name: string } | null>(null);

  const { data: surveys, isLoading } = useSurveys();
  const deleteSurvey = useDeleteSurvey();

  const filteredSurveys = surveys?.filter((survey) =>
    survey.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (survey: Survey) => {
    setSelectedSurvey(survey);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setSurveyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (surveyToDelete) {
      await deleteSurvey.mutateAsync(surveyToDelete);
      setDeleteDialogOpen(false);
      setSurveyToDelete(null);
    }
  };

  const handleViewResponses = (surveyId: string) => {
    setViewingSurveyId(surveyId);
    setResponsesDialogOpen(true);
  };

  const handleImportResponses = (survey: Survey) => {
    setImportingSurvey({ id: survey.id, name: survey.name });
    setImportDialogOpen(true);
  };

  const handleAIAnalysis = (survey: Survey) => {
    setAnalyzingSurvey({ id: survey.id, name: survey.name });
    setAiDialogOpen(true);
  };

  const handleAnalyticsDashboard = (survey: Survey) => {
    setAnalyticsSurvey({ id: survey.id, name: survey.name });
    setAnalyticsDashboardOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pesquisas de Qualificação MQL</h1>
          <p className="text-muted-foreground">
            Registre e analise pesquisas de qualificação para seus leads
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar pesquisas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => {
              setSelectedSurvey(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Pesquisa
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : filteredSurveys && filteredSurveys.length > 0 ? (
          <div className="grid gap-4">
            {filteredSurveys.map((survey: Survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewResponses={handleViewResponses}
                onImportResponses={handleImportResponses}
                onAIAnalysis={handleAIAnalysis}
                onAnalyticsDashboard={handleAnalyticsDashboard}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhuma pesquisa encontrada</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie sua primeira pesquisa MQL para começar a qualificar seus leads
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Pesquisa
              </Button>
            </CardContent>
          </Card>
        )}

        <SurveyDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          survey={selectedSurvey}
        />

        <Dialog open={responsesDialogOpen} onOpenChange={setResponsesDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Respostas da Pesquisa</DialogTitle>
            </DialogHeader>
            {viewingSurveyId && (
              <SurveyResponsesTable 
                surveyId={viewingSurveyId} 
                surveyName={surveys?.find(s => s.id === viewingSurveyId)?.name || "Pesquisa"}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        {importingSurvey && (
          <SurveyResponseImportDialog
            open={importDialogOpen}
            onOpenChange={setImportDialogOpen}
            surveyId={importingSurvey.id}
            surveyName={importingSurvey.name}
          />
        )}

        {/* AI Analysis Dialog */}
        {analyzingSurvey && (
          <SurveyAIAnalysis
            open={aiDialogOpen}
            onOpenChange={setAiDialogOpen}
            surveyId={analyzingSurvey.id}
            surveyName={analyzingSurvey.name}
          />
        )}

        {/* Analytics Dashboard */}
        {analyticsSurvey && (
          <SurveyAnalyticsDashboard
            open={analyticsDashboardOpen}
            onOpenChange={setAnalyticsDashboardOpen}
            surveyId={analyticsSurvey.id}
            surveyName={analyticsSurvey.name}
          />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta pesquisa? Esta ação não pode ser desfeita e
                todas as respostas serão perdidas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

// Survey Card Component with response count
function SurveyCard({ 
  survey, 
  onEdit, 
  onDelete, 
  onViewResponses, 
  onImportResponses,
  onAIAnalysis,
  onAnalyticsDashboard 
}: {
  survey: Survey;
  onEdit: (survey: Survey) => void;
  onDelete: (id: string) => void;
  onViewResponses: (id: string) => void;
  onImportResponses: (survey: Survey) => void;
  onAIAnalysis: (survey: Survey) => void;
  onAnalyticsDashboard: (survey: Survey) => void;
}) {
  const { data: responses } = useSurveyResponses(survey.id);
  const responseCount = responses?.length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {survey.name}
              {responseCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {responseCount} {responseCount === 1 ? "resposta" : "respostas"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {(survey as Survey & { campaigns?: { name: string } }).campaigns?.name ? `Campanha: ${(survey as Survey & { campaigns?: { name: string } }).campaigns.name}` : "Sem campanha"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(survey)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(survey.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {survey.description || "Sem descrição"}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Criado em: {format(new Date(survey.created_at!), "dd/MM/yyyy")}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onImportResponses(survey)}
              className="gap-1"
            >
              <Upload className="h-3.5 w-3.5" />
              Importar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAnalyticsDashboard(survey)}
              className="gap-1"
              disabled={responseCount === 0}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAIAnalysis(survey)}
              className="gap-1"
              disabled={responseCount === 0}
            >
              <Sparkles className="h-3.5 w-3.5" />
              IA
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewResponses(survey.id)}
            >
              Ver Respostas
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
