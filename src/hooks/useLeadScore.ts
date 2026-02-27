import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type MQLLevel = "cold" | "warm" | "hot" | "qualified";

export interface LeadScoreData {
  mql_score: number;
  mql_level: MQLLevel;
  last_survey_at: string | null;
}

export const calculateMQLLevel = (score: number): MQLLevel => {
  if (score >= 81) return "qualified";
  if (score >= 61) return "hot";
  if (score >= 31) return "warm";
  return "cold";
};

export const getMQLLevelLabel = (level: MQLLevel | null | undefined): string => {
  switch (level) {
    case "qualified": return "Qualificado";
    case "hot": return "Quente";
    case "warm": return "Morno";
    case "cold": return "Frio";
    default: return "Não qualificado";
  }
};

export const getMQLLevelColor = (level: MQLLevel | null | undefined): string => {
  switch (level) {
    case "qualified": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    case "hot": return "bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] text-[hsl(160,55%,40%)] dark:text-[#CCFF00] border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)]";
    case "warm": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "cold": return "bg-muted/60 text-muted-foreground border-border";
    default: return "bg-muted/50 text-muted-foreground border-border";
  }
};

export const getMQLLevelIcon = (level: MQLLevel | null | undefined): string => {
  switch (level) {
    case "qualified": return "🔥";
    case "hot": return "🟢";
    case "warm": return "🟡";
    case "cold": return "🔵";
    default: return "⚪";
  }
};

// Calculate score based on survey responses
export const calculateScoreFromResponses = (answers: Record<string, any>): number => {
  let score = 0;

  // Faixa de renda scoring
  const renda = answers.renda || answers.faixa_renda || answers.income;
  if (renda) {
    const rendaStr = String(renda).toLowerCase();
    if (rendaStr.includes("20") || rendaStr.includes("20000")) score += 30;
    else if (rendaStr.includes("10") && rendaStr.includes("20")) score += 25;
    else if (rendaStr.includes("5") && rendaStr.includes("10")) score += 20;
    else if (rendaStr.includes("3") && rendaStr.includes("5")) score += 10;
    else score += 5;
  }

  // Nível de consciência scoring
  const consciencia = answers.consciencia || answers.awareness || answers.conhece_produto || answers.prontidao;
  if (consciencia) {
    const conscStr = String(consciencia).toLowerCase();
    if (conscStr.includes("pronto") || conscStr.includes("agora") || conscStr.includes("imediato")) score += 40;
    else if (conscStr.includes("mês") || conscStr.includes("breve") || conscStr.includes("próximo")) score += 25;
    else if (conscStr.includes("conheco") || conscStr.includes("acompanho")) score += 15;
    else score += 5;
  }

  // Pronto para comprar scoring
  const prontidao = answers.prontidao || answers.ready_to_buy || answers.momento || answers.buscando_solucao;
  if (prontidao && prontidao !== consciencia) {
    const prontStr = String(prontidao).toLowerCase();
    if (prontStr.includes("agora") || prontStr.includes("imediato") || prontStr.includes("decidir")) score += 30;
    else if (prontStr.includes("mês") || prontStr.includes("breve") || prontStr.includes("comparando")) score += 20;
    else if (prontStr.includes("pesquisando")) score += 10;
    else score += 5;
  }

  return Math.min(score, 100);
};

// Extract MQL data from lead metadata
export const extractMQLFromMetadata = (metadata: any): LeadScoreData => {
  const mql = metadata?.mql || {};
  return {
    mql_score: mql.score ?? 0,
    mql_level: mql.level ?? null,
    last_survey_at: mql.last_survey_at ?? null,
  };
};

export const useLeadMQLData = (leadId: string) => {
  return useQuery({
    queryKey: ["lead-mql", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("metadata")
        .eq("lead_id", leadId)
        .single();

      if (error) throw error;
      return extractMQLFromMetadata(data?.metadata);
    },
    enabled: !!leadId,
  });
};

export const useUpdateLeadMQL = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, score }: { leadId: string; score: number }) => {
      const level = calculateMQLLevel(score);
      
      // First get current metadata
      const { data: current } = await supabase
        .from("leads")
        .select("metadata")
        .eq("lead_id", leadId)
        .single();

      const currentMetadata = (current?.metadata as Record<string, any>) || {};
      const newMetadata = {
        ...currentMetadata,
        mql: {
          score,
          level,
          last_survey_at: new Date().toISOString(),
        },
      };
      
      const { data, error } = await supabase
        .from("leads")
        .update({ metadata: newMetadata })
        .eq("lead_id", leadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ["lead-mql", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Score MQL atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar score: ${error.message}`);
    },
  });
};

export const useLeadsWithMQL = () => {
  return useQuery({
    queryKey: ["leads-mql-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("lead_id, metadata");

      if (error) throw error;
      
      const leadsWithMQL = data
        .map(l => extractMQLFromMetadata(l.metadata))
        .filter(l => l.mql_score > 0);
      
      const summary = {
        total: leadsWithMQL.length,
        qualified: leadsWithMQL.filter(l => l.mql_level === "qualified").length,
        hot: leadsWithMQL.filter(l => l.mql_level === "hot").length,
        warm: leadsWithMQL.filter(l => l.mql_level === "warm").length,
        cold: leadsWithMQL.filter(l => l.mql_level === "cold").length,
        averageScore: leadsWithMQL.length > 0 
          ? Math.round(leadsWithMQL.reduce((sum, l) => sum + (l.mql_score || 0), 0) / leadsWithMQL.length)
          : 0,
      };

      return summary;
    },
  });
};
