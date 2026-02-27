import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBulkAddTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadIds, tagId }: { leadIds: string[]; tagId: string }) => {
      const insertData = leadIds.map(leadId => ({
        lead_id: leadId,
        tag_id: tagId,
        source: 'bulk'
      }));

      const { error } = await supabase
        .from("lead_tags")
        .upsert(insertData, { 
          onConflict: 'lead_id,tag_id',
          ignoreDuplicates: true 
        });

      if (error) throw error;
      return { count: leadIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lead-tags"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`Tag adicionada a ${data.count} leads`);
    },
    onError: (error: any) => {
      console.error("Error adding tag in bulk:", error);
      toast.error("Erro ao adicionar tag: " + error.message);
    },
  });
};

export const useBulkRemoveTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadIds, tagId }: { leadIds: string[]; tagId: string }) => {
      const { error } = await supabase
        .from("lead_tags")
        .delete()
        .in("lead_id", leadIds)
        .eq("tag_id", tagId);

      if (error) throw error;
      return { count: leadIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lead-tags"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`Tag removida de ${data.count} leads`);
    },
    onError: (error: any) => {
      console.error("Error removing tag in bulk:", error);
      toast.error("Erro ao remover tag: " + error.message);
    },
  });
};

export const useBulkUpdateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadIds, status }: { leadIds: string[]; status: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ crm_status: status, updated_at: new Date().toISOString() })
        .in("lead_id", leadIds);

      if (error) throw error;
      return { count: leadIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`Status atualizado em ${data.count} leads`);
    },
    onError: (error: any) => {
      console.error("Error updating status in bulk:", error);
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });
};

export const useBulkDeleteLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadIds }: { leadIds: string[] }) => {
      // Delete related data first
      await supabase.from("lead_tags").delete().in("lead_id", leadIds);
      await supabase.from("lead_events").delete().in("lead_id", leadIds);
      await supabase.from("lead_versions").delete().in("lead_id", leadIds);
      await supabase.from("survey_responses").delete().in("lead_id", leadIds);
      
      // Then delete leads
      const { error } = await supabase
        .from("leads")
        .delete()
        .in("lead_id", leadIds);

      if (error) throw error;
      return { count: leadIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-summary"] });
      toast.success(`${data.count} leads excluídos`);
    },
    onError: (error: any) => {
      console.error("Error deleting leads in bulk:", error);
      toast.error("Erro ao excluir leads: " + error.message);
    },
  });
};
