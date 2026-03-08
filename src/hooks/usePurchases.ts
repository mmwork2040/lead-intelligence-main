import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentUserId } from "@/lib/getCurrentUserId";
import type { Database } from "@/integrations/supabase/types";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
type PurchaseInsert = Database["public"]["Tables"]["purchases"]["Insert"];
type PurchaseUpdate = Database["public"]["Tables"]["purchases"]["Update"];

export const usePurchases = (leadId?: string) => {
  return useQuery({
    queryKey: ["purchases", leadId],
    queryFn: async () => {
      let query = supabase.from("purchases").select("*").order("purchase_date", { ascending: false });

      if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Purchase[];
    },
    enabled: !!leadId,
  });
};

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (purchase: PurchaseInsert) => {
      const user_id = await getCurrentUserId();
      const { data, error } = await supabase
        .from("purchases")
        .insert({ ...purchase, user_id })
        .select()
        .single();

      if (error) throw error;

      // Create event
      const { error: eventError } = await supabase.from("lead_events").insert({
        lead_id: purchase.lead_id,
        event_type: "purchase_created",
        event_data: {
          product_name: purchase.product_name,
          value: purchase.value,
          status: purchase.status,
        },
        source: "manual",
        user_id,
      });
      if (eventError) console.error('Error creating purchase event:', eventError);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["purchases", data.lead_id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["client-summary"] });
      toast.success("Compra adicionada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating purchase:", error);
      toast.error("Erro ao adicionar compra");
    },
  });
};

export const useUpdatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PurchaseUpdate }) => {
      const { data, error } = await supabase
        .from("purchases")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Create event
      if (data) {
        const { error: eventError } = await supabase.from("lead_events").insert({
          lead_id: data.lead_id,
          event_type: "purchase_updated",
          event_data: updates,
          source: "manual",
        });
        if (eventError) console.error('Error creating purchase event:', eventError);
      }

      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["purchases", data.lead_id] });
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        queryClient.invalidateQueries({ queryKey: ["client-summary"] });
      }
      toast.success("Compra atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating purchase:", error);
      toast.error("Erro ao atualizar compra");
    },
  });
};

export const useDeletePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }) => {
      const { error } = await supabase.from("purchases").delete().eq("id", id);

      if (error) throw error;

      // Create event
      const { error: eventError } = await supabase.from("lead_events").insert({
        lead_id: leadId,
        event_type: "purchase_deleted",
        event_data: { purchase_id: id },
        source: "manual",
      });
      if (eventError) console.error('Error creating purchase event:', eventError);

      return { id, leadId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["purchases", data.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["client-summary"] });
      toast.success("Compra removida com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting purchase:", error);
      toast.error("Erro ao remover compra");
    },
  });
};
