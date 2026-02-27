import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SurveyResponse {
  id: string;
  survey_id: string;
  lead_id: string;
  answers: Record<string, any>;
  created_at: string;
  leads?: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export const useSurveyResponses = (surveyId?: string) => {
  return useQuery({
    queryKey: ["survey_responses", surveyId],
    queryFn: async () => {
      let query = supabase
        .from("survey_responses")
        .select("*, leads(name, email, phone)");

      if (surveyId) {
        query = query.eq("survey_id", surveyId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as SurveyResponse[];
    },
    enabled: !!surveyId,
  });
};

export const useCreateSurveyResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newResponse: { survey_id: string; lead_id: string; answers: Record<string, any> }) => {
      const { data, error } = await supabase
        .from("survey_responses")
        .insert([{
          survey_id: newResponse.survey_id,
          lead_id: newResponse.lead_id,
          answers: newResponse.answers,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey_responses"] });
      toast.success("Resposta registrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar resposta: ${error.message}`);
    },
  });
};
