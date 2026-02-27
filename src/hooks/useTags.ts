import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database["public"]["Tables"]["tags"]["Row"];
type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];

export const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Tag[];
    },
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tag: TagInsert) => {
      const { data, error } = await supabase
        .from("tags")
        .insert(tag)
        .select()
        .single();

      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag criada com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error creating tag:", error);
      toast.error(error.message || "Erro ao criar tag");
    },
  });
};

export const useLeadTags = (leadId: string) => {
  return useQuery({
    queryKey: ["lead-tags", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_tags")
        .select("*, tags(*)")
        .eq("lead_id", leadId);

      if (error) throw error;
      return data;
    },
    enabled: !!leadId,
  });
};

export const useAddTagToLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, tagId, source }: { leadId: string; tagId: string; source?: string }) => {
      const { data, error } = await supabase
        .from("lead_tags")
        .insert({ lead_id: leadId, tag_id: tagId, source: source || "manual" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-tags", variables.leadId] });
    },
    onError: (error: any) => {
      console.error("Error adding tag to lead:", error);
      toast.error(error.message || "Erro ao adicionar tag");
    },
  });
};

export const useRemoveTagFromLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, tagId }: { leadId: string; tagId: string }) => {
      const { error } = await supabase
        .from("lead_tags")
        .delete()
        .eq("lead_id", leadId)
        .eq("tag_id", tagId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-tags", variables.leadId] });
      toast.success("Tag removida com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error removing tag from lead:", error);
      toast.error(error.message || "Erro ao remover tag");
    },
  });
};
