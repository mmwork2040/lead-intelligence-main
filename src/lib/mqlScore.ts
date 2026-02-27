export type MQLLevel = "cold" | "warm" | "hot" | "qualified";

export type QuestionCategory = "identifier" | "demographic" | "income" | "awareness" | "other";

export interface QuestionMapping {
  column: string;
  category: QuestionCategory;
  weight: number;
}

export interface ScoreResult {
  score: number;
  level: MQLLevel;
  percentile: number;
  breakdown: Record<string, number>;
}

// Patterns to detect question categories
const categoryPatterns: Record<QuestionCategory, RegExp[]> = {
  identifier: [
    /e-?mail/i,
    /email/i,
    /telefone/i,
    /phone/i,
    /whatsapp/i,
    /celular/i,
    /nome/i,
    /name/i,
    /cpf/i,
  ],
  demographic: [
    /idade/i,
    /faixa et[áa]ria/i,
    /profiss[ãa]o/i,
    /ocupa[çc][ãa]o/i,
    /escolaridade/i,
    /forma[çc][ãa]o/i,
    /cidade/i,
    /estado/i,
    /regi[ãa]o/i,
    /g[êe]nero/i,
    /sexo/i,
  ],
  income: [
    /renda/i,
    /sal[áa]rio/i,
    /ganho/i,
    /faturamento/i,
    /investir/i,
    /investimento/i,
    /quanto.*disposto/i,
    /capital/i,
    /dinheiro/i,
    /valor.*dispon[íi]vel/i,
    /or[çc]amento/i,
  ],
  awareness: [
    /conhece/i,
    /pronto/i,
    /momento/i,
    /decis[ãa]o/i,
    /comprar/i,
    /adquirir/i,
    /interessado/i,
    /quando.*pretende/i,
    /urg[êe]ncia/i,
    /prioridade/i,
    /buscando/i,
    /precisando/i,
    /problema/i,
    /solu[çc][ãa]o/i,
    /j[áa].*tentou/i,
  ],
  other: [],
};

// Detect category based on question text
export const detectQuestionCategory = (question: string): QuestionCategory => {
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    if (category === "other") continue;
    for (const pattern of patterns) {
      if (pattern.test(question)) {
        return category as QuestionCategory;
      }
    }
  }
  return "other";
};

// Get default weight for category
export const getDefaultWeight = (category: QuestionCategory): number => {
  switch (category) {
    case "awareness":
      return 40;
    case "income":
      return 35;
    case "demographic":
      return 15;
    case "identifier":
      return 0;
    case "other":
      return 10;
  }
};

// Score response based on common patterns
const scoreResponse = (response: string, category: QuestionCategory): number => {
  if (!response || typeof response !== "string") return 0;
  
  const lower = response.toLowerCase().trim();
  
  if (category === "income") {
    // Higher income = higher score
    if (/acima|mais.*de.*20|20\.?000|\+.*20/i.test(lower)) return 100;
    if (/10.*20|15\.?000|entre.*10.*20/i.test(lower)) return 80;
    if (/5.*10|7\.?000|8\.?000|entre.*5.*10/i.test(lower)) return 60;
    if (/3.*5|4\.?000|entre.*3.*5/i.test(lower)) return 40;
    if (/1.*3|2\.?000|at[ée].*3/i.test(lower)) return 20;
    if (/at[ée].*1|menos|n[ãa]o.*tenho/i.test(lower)) return 10;
  }
  
  if (category === "awareness") {
    // Ready to buy = higher score
    if (/agora|imediato|pronto|j[áa].*decidi|hoje|essa.*semana/i.test(lower)) return 100;
    if (/este.*m[êe]s|pr[óo]ximo.*m[êe]s|30.*dias|breve/i.test(lower)) return 75;
    if (/3.*meses|trimestre|em.*breve/i.test(lower)) return 50;
    if (/6.*meses|semestre|pesquisando|comparando/i.test(lower)) return 35;
    if (/ano|futuro|talvez|n[ãa]o.*sei|ainda.*n[ãa]o/i.test(lower)) return 15;
    if (/nunca|n[ãa]o.*pretendo|sem.*interesse/i.test(lower)) return 5;
    
    // Yes/No patterns
    if (/^sim$|^s$|^yes$|^y$/i.test(lower)) return 80;
    if (/^n[ãa]o$|^n$|^no$/i.test(lower)) return 20;
  }
  
  if (category === "demographic") {
    // Age patterns (higher ages often mean more buying power)
    if (/45.*54|50.*59|55.*64/i.test(lower)) return 80;
    if (/35.*44|40.*49/i.test(lower)) return 70;
    if (/25.*34|30.*39/i.test(lower)) return 60;
    if (/18.*24|20.*29/i.test(lower)) return 40;
    if (/65|aposentado|60\+|acima.*60/i.test(lower)) return 50;
    
    // Education patterns
    if (/p[óo]s|mestrado|doutorado|mba/i.test(lower)) return 80;
    if (/superior|gradua[çc][ãa]o|faculdade/i.test(lower)) return 60;
    if (/t[ée]cnico/i.test(lower)) return 45;
    if (/m[ée]dio|ensino.*m[ée]dio/i.test(lower)) return 30;
  }
  
  // Default scoring for other categories
  return 50;
};

// Calculate dynamic score based on mapped questions
export const calculateDynamicScore = (
  answers: Record<string, any>,
  mappings: QuestionMapping[]
): { score: number; breakdown: Record<string, number> } => {
  const scoringMappings = mappings.filter(
    (m) => m.category !== "identifier" && m.weight > 0
  );
  
  if (scoringMappings.length === 0) {
    return { score: 0, breakdown: {} };
  }
  
  const totalWeight = scoringMappings.reduce((sum, m) => sum + m.weight, 0);
  let totalScore = 0;
  const breakdown: Record<string, number> = {};
  
  for (const mapping of scoringMappings) {
    const response = answers[mapping.column];
    const responseScore = scoreResponse(String(response || ""), mapping.category);
    const weightedScore = (responseScore * mapping.weight) / totalWeight;
    totalScore += weightedScore;
    breakdown[mapping.column] = responseScore;
  }
  
  return {
    score: Math.round(totalScore),
    breakdown,
  };
};

// Calculate percentile rank
export const calculatePercentile = (score: number, allScores: number[]): number => {
  if (allScores.length === 0) return 0;
  const belowCount = allScores.filter((s) => s < score).length;
  return Math.round((belowCount / allScores.length) * 100);
};

// Calculate level based on percentile
export const calculateLevelFromPercentile = (percentile: number): MQLLevel => {
  if (percentile >= 80) return "qualified"; // Top 20%
  if (percentile >= 60) return "hot";        // Top 40%
  if (percentile >= 30) return "warm";       // Top 70%
  return "cold";
};

// Auto-detect mappings from headers
export const autoDetectMappings = (headers: string[]): QuestionMapping[] => {
  return headers.map((header) => {
    const category = detectQuestionCategory(header);
    return {
      column: header,
      category,
      weight: getDefaultWeight(category),
    };
  });
};

// Get category label in Portuguese
export const getCategoryLabel = (category: QuestionCategory): string => {
  switch (category) {
    case "identifier":
      return "Identificador";
    case "demographic":
      return "Demográfico";
    case "income":
      return "Renda";
    case "awareness":
      return "Consciência";
    case "other":
      return "Outro";
  }
};

// Get category color
export const getCategoryColor = (category: QuestionCategory): string => {
  switch (category) {
    case "identifier":
      return "bg-muted/60 text-muted-foreground border-border";
    case "demographic":
      return "bg-primary/10 text-primary border-primary/20";
    case "income":
      return "bg-[rgba(16,185,129,0.10)] text-[hsl(160,55%,40%)] dark:bg-[rgba(204,255,0,0.08)] dark:text-[#CCFF00] border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)]";
    case "awareness":
      return "bg-[rgba(245,158,11,0.10)] text-[hsl(38,92%,45%)] dark:text-[hsl(45,100%,55%)] border-[rgba(245,158,11,0.20)]";
    case "other":
      return "bg-muted/60 text-muted-foreground border-border";
  }
};
