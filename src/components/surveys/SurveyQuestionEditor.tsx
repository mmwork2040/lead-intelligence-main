import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, X } from "lucide-react";

export interface SurveyQuestion {
  id: string;
  question: string;
  type: "text" | "single_choice" | "multiple_choice" | "number" | "scale";
  options?: string[];
  category?: string;
}

interface SurveyQuestionEditorProps {
  questions: SurveyQuestion[];
  onChange: (questions: SurveyQuestion[]) => void;
}

const questionTypes = [
  { value: "text", label: "Texto livre" },
  { value: "single_choice", label: "Escolha única" },
  { value: "multiple_choice", label: "Múltipla escolha" },
  { value: "number", label: "Número" },
  { value: "scale", label: "Escala (1-10)" },
];

const questionCategories = [
  { value: "identifier", label: "Identificador" },
  { value: "demographic", label: "Demográfico" },
  { value: "income", label: "Renda" },
  { value: "awareness", label: "Consciência" },
  { value: "interest", label: "Interesse" },
  { value: "other", label: "Outro" },
];

export function SurveyQuestionEditor({ questions, onChange }: SurveyQuestionEditorProps) {
  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: `q_${Date.now()}`,
      question: "",
      type: "text",
      options: [],
      category: "other",
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<SurveyQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    const options = updated[questionIndex].options || [];
    updated[questionIndex].options = [...options, ""];
    onChange(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    const options = [...(updated[questionIndex].options || [])];
    options[optionIndex] = value;
    updated[questionIndex].options = options;
    onChange(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    const options = (updated[questionIndex].options || []).filter((_, i) => i !== optionIndex);
    updated[questionIndex].options = options;
    onChange(updated);
  };

  const needsOptions = (type: string) => 
    type === "single_choice" || type === "multiple_choice";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Perguntas ({questions.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>Nenhuma pergunta adicionada</p>
          <Button type="button" variant="link" onClick={addQuestion} className="mt-2">
            Adicionar primeira pergunta
          </Button>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {questions.map((q, index) => (
            <Card key={q.id} className="p-4">
              <div className="flex items-start gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <Input
                      value={q.question}
                      onChange={(e) => updateQuestion(index, { question: e.target.value })}
                      placeholder="Digite a pergunta..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2 pl-8">
                    <Select
                      value={q.type}
                      onValueChange={(value) => updateQuestion(index, { 
                        type: value as SurveyQuestion["type"],
                        options: needsOptions(value) ? (q.options?.length ? q.options : [""]) : []
                      })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={q.category || "other"}
                      onValueChange={(value) => updateQuestion(index, { category: value })}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {needsOptions(q.type) && (
                    <div className="pl-8 space-y-2">
                      <Label className="text-xs text-muted-foreground">Opções de resposta:</Label>
                      {(q.options || []).map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, optIndex, e.target.value)}
                            placeholder={`Opção ${optIndex + 1}`}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index, optIndex)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addOption(index)}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar opção
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
