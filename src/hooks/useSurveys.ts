import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentUserId } from "@/lib/getCurrentUserId";

export interface Survey {
  id: string;
  name: string;
  description: string | null;
  campaign_id: string | null;
  questions: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSurveys = () => {
  return useQuery({
    queryKey: ["surveys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("*, campaigns(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Survey[];
    },
  });
};

export const useCreateSurvey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSurvey: { name: string; description?: string | null; campaign_id?: string | null; questions?: any[] }) => {
      const user_id = await getCurrentUserId();
      const { data, error } = await supabase
        .from("surveys")
        .insert([{
          name: newSurvey.name,
          description: newSurvey.description,
          campaign_id: newSurvey.campaign_id,
          questions: newSurvey.questions || [],
          user_id,
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      toast.success("Pesquisa criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar pesquisa: ${error.message}`);
    },
  });
};

export const useUpdateSurvey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Survey> & { id: string }) => {
      const { data, error } = await supabase
        .from("surveys")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      toast.success("Pesquisa atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar pesquisa: ${error.message}`);
    },
  });
};

export const useDeleteSurvey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("surveys").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      toast.success("Pesquisa excluída com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir pesquisa: ${error.message}`);
    },
  });
};
