import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DuplicateLead {
  lead_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  reason: string;
  created_at: string;
}

interface UnificationResult {
  success: boolean;
  message?: string;
  duplicates?: DuplicateLead[];
  master_lead_id?: string;
  merged_lead_ids?: string[];
  merge_logs?: any[];
  error?: string;
}

export const useCheckDuplicates = (leadId?: string) => {
  return useQuery({
    queryKey: ["lead-duplicates", leadId],
    queryFn: async () => {
      if (!leadId) return null;

      const { data, error } = await supabase.functions.invoke("unify-leads", {
        body: { lead_id: leadId, auto_merge: false },
      });

      if (error) throw error;
      return data as UnificationResult;
    },
    enabled: !!leadId,
  });
};

export const useUnifyLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, autoMerge }: { leadId: string; autoMerge: boolean }) => {
      const { data, error } = await supabase.functions.invoke("unify-leads", {
        body: { lead_id: leadId, auto_merge: autoMerge },
      });

      if (error) throw error;
      return data as UnificationResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-duplicates"] });
      queryClient.invalidateQueries({ queryKey: ["merge-logs"] });
      
      if (data.success) {
        toast.success(data.message || "Leads unificados com sucesso!");
      } else {
        toast.error(data.error || "Erro ao unificar leads");
      }
    },
    onError: (error: Error) => {
      console.error("Error unifying leads:", error);
      toast.error(error.message || "Erro ao unificar leads");
    },
  });
};

export const useMergeLogs = (masterLeadId?: string) => {
  return useQuery({
    queryKey: ["merge-logs", masterLeadId],
    queryFn: async () => {
      let query = supabase
        .from("lead_merge_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (masterLeadId) {
        query = query.eq("master_lead_id", masterLeadId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!masterLeadId,
  });
};

export const useReviewMerge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ logId, reviewed }: { logId: string; reviewed: boolean }) => {
      const { data: authData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("lead_merge_logs")
        .update({
          reviewed,
          reviewed_by: authData?.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", logId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merge-logs"] });
      toast.success("Revisão registrada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error reviewing merge:", error);
      toast.error(error.message || "Erro ao registrar revisão");
    },
  });
};
