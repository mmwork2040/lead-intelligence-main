import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateSurvey, useUpdateSurvey, Survey } from "@/hooks/useSurveys";
import { useCampaigns } from "@/hooks/useCampaigns";
import { MQL_TEMPLATES, MQLTemplateCard, MQLTemplate } from "./MQLTemplates";
import { SurveyQuestionEditor, SurveyQuestion } from "./SurveyQuestionEditor";

interface SurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  survey?: Survey;
}

export function SurveyDialog({ open, onOpenChange, survey }: SurveyDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MQLTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  const { data: campaigns } = useCampaigns();
  const createSurvey = useCreateSurvey();
  const updateSurvey = useUpdateSurvey();

  useEffect(() => {
    if (survey) {
      setName(survey.name);
      setDescription(survey.description || "");
      setCampaignId(survey.campaign_id || "");
      // Parse existing questions
      const existingQuestions = Array.isArray(survey.questions) 
        ? survey.questions as SurveyQuestion[]
        : [];
      setQuestions(existingQuestions);
      setShowTemplates(false);
      setSelectedTemplate(null);
      setActiveTab("info");
    } else {
      setName("");
      setDescription("");
      setCampaignId("");
      setQuestions([]);
      setShowTemplates(true);
      setSelectedTemplate(null);
      setActiveTab("info");
    }
  }, [survey, open]);

  const handleSelectTemplate = (template: MQLTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setQuestions(template.questions as SurveyQuestion[]);
    setShowTemplates(false);
  };

  const handleSubmit = async () => {
    const surveyData = {
      name,
      description,
      campaign_id: campaignId || null,
      questions: questions,
    };

    if (survey) {
      await updateSurvey.mutateAsync({ id: survey.id, ...surveyData });
    } else {
      await createSurvey.mutateAsync(surveyData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{survey ? "Editar Pesquisa" : "Nova Pesquisa MQL"}</DialogTitle>
          <DialogDescription>
            {survey
              ? "Atualize as informações e perguntas da pesquisa"
              : "Crie uma nova pesquisa para qualificação de leads"}
          </DialogDescription>
        </DialogHeader>

        {/* Template Selection (only for new surveys) */}
        {!survey && showTemplates && (
          <div className="space-y-4 py-4 overflow-y-auto">
            <div>
              <Label className="text-base font-semibold">Escolha um template MQL</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Selecione um modelo pronto ou crie uma pesquisa personalizada
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {MQL_TEMPLATES.map((template) => (
                <MQLTemplateCard
                  key={template.id}
                  template={template}
                  selected={selectedTemplate?.id === template.id}
                  onSelect={() => handleSelectTemplate(template)}
                />
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <Button 
                variant="ghost" 
                onClick={() => setShowTemplates(false)}
                className="text-muted-foreground"
              >
                Criar pesquisa do zero
              </Button>
            </div>
          </div>
        )}

        {/* Form Fields with Tabs */}
        {(!showTemplates || survey) && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="questions">
                Perguntas ({questions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="flex-1 overflow-y-auto space-y-4 py-4">
              {!survey && selectedTemplate && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-xl">{selectedTemplate.icon}</span>
                  <div>
                    <p className="text-sm font-medium">Template: {selectedTemplate.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {questions.length} perguntas pré-definidas
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto"
                    onClick={() => {
                      setShowTemplates(true);
                      setSelectedTemplate(null);
                      setName("");
                      setDescription("");
                      setQuestions([]);
                    }}
                  >
                    Trocar
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome da Pesquisa</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pesquisa de Qualificação MQL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o objetivo da pesquisa..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Campanha (Opcional)</Label>
                <Select value={campaignId || "none"} onValueChange={(value) => setCampaignId(value === "none" ? "" : value)}>
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder="Selecionar campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma campanha</SelectItem>
                    {campaigns?.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="flex-1 overflow-hidden py-4">
              <SurveyQuestionEditor 
                questions={questions} 
                onChange={setQuestions} 
              />
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="pt-4 border-t">
          {!survey && !showTemplates && (
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTemplates(true);
                if (!selectedTemplate) {
                  setName("");
                  setDescription("");
                  setQuestions([]);
                }
              }}
            >
              Voltar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {!showTemplates && (
            <Button onClick={handleSubmit} disabled={!name}>
              {survey ? "Salvar" : "Criar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
