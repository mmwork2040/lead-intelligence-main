import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, DollarSign, Target, Sparkles } from "lucide-react";

export interface MQLQuestion {
  id: string;
  question: string;
  type: "single" | "multiple" | "text" | "scale";
  options?: string[];
  category: "demographic" | "income" | "awareness";
}

export interface MQLTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  questions: MQLQuestion[];
}

export const MQL_TEMPLATES: MQLTemplate[] = [
  {
    id: "demographic",
    name: "Demográfico",
    description: "Idade, profissão, escolaridade",
    icon: <User className="w-5 h-5" />,
    questions: [
      {
        id: "faixa_etaria",
        question: "Qual sua faixa etária?",
        type: "single",
        options: ["18-24 anos", "25-34 anos", "35-44 anos", "45-54 anos", "55+ anos"],
        category: "demographic",
      },
      {
        id: "profissao",
        question: "Qual sua profissão ou área de atuação?",
        type: "text",
        category: "demographic",
      },
      {
        id: "escolaridade",
        question: "Qual seu nível de escolaridade?",
        type: "single",
        options: ["Ensino Médio", "Superior Incompleto", "Superior Completo", "Pós-graduação", "Mestrado/Doutorado"],
        category: "demographic",
      },
    ],
  },
  {
    id: "income",
    name: "Renda",
    description: "Faixa salarial, capacidade de investimento",
    icon: <DollarSign className="w-5 h-5" />,
    questions: [
      {
        id: "renda",
        question: "Qual sua faixa de renda mensal?",
        type: "single",
        options: ["Até R$3.000", "R$3.000 - R$5.000", "R$5.000 - R$10.000", "R$10.000 - R$20.000", "Acima de R$20.000"],
        category: "income",
      },
      {
        id: "situacao_profissional",
        question: "Qual sua situação profissional?",
        type: "single",
        options: ["CLT", "Autônomo/Freelancer", "Empresário", "Servidor Público", "Desempregado/Em transição"],
        category: "income",
      },
      {
        id: "investimento",
        question: "Quanto poderia investir em educação/desenvolvimento?",
        type: "single",
        options: ["Até R$500", "R$500 - R$1.000", "R$1.000 - R$3.000", "R$3.000 - R$5.000", "Acima de R$5.000"],
        category: "income",
      },
    ],
  },
  {
    id: "awareness",
    name: "Consciência",
    description: "Nível de awareness e prontidão",
    icon: <Target className="w-5 h-5" />,
    questions: [
      {
        id: "conhece_problema",
        question: "Você conhece o problema que nosso produto/serviço resolve?",
        type: "single",
        options: ["Não conheço", "Conheço pouco", "Conheço bem", "Estou sofrendo com isso agora"],
        category: "awareness",
      },
      {
        id: "buscando_solucao",
        question: "Está buscando ativamente uma solução?",
        type: "single",
        options: ["Não estou buscando", "Estou pesquisando", "Estou comparando opções", "Pronto para decidir"],
        category: "awareness",
      },
      {
        id: "conhece_produto",
        question: "Já conhece nosso produto/método?",
        type: "single",
        options: ["Nunca ouvi falar", "Vi algo nas redes", "Acompanho o conteúdo", "Conheço bem"],
        category: "awareness",
      },
      {
        id: "prontidao",
        question: "Está pronto para investir?",
        type: "single",
        options: ["Não no momento", "Em 3-6 meses", "No próximo mês", "Agora mesmo"],
        category: "awareness",
      },
    ],
  },
  {
    id: "complete",
    name: "MQL Completo",
    description: "Todas as categorias combinadas",
    icon: <Sparkles className="w-5 h-5" />,
    questions: [], // Will be populated with all questions
  },
];

// Populate complete template
MQL_TEMPLATES.find(t => t.id === "complete")!.questions = [
  ...MQL_TEMPLATES.find(t => t.id === "demographic")!.questions,
  ...MQL_TEMPLATES.find(t => t.id === "income")!.questions,
  ...MQL_TEMPLATES.find(t => t.id === "awareness")!.questions,
];

interface MQLTemplateCardProps {
  template: MQLTemplate;
  selected: boolean;
  onSelect: () => void;
}

export function MQLTemplateCard({ template, selected, onSelect }: MQLTemplateCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
        selected ? "border-primary bg-primary/5" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          selected ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}>
          {template.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{template.name}</h4>
            {template.id === "complete" && (
              <Badge variant="secondary" className="text-xs">Recomendado</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{template.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {template.questions.length} perguntas
          </p>
        </div>
      </div>
    </Card>
  );
}
