import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PeriodFilter, calculateDateRange } from "@/lib/dateUtils";

export type CRMStatus = "lead" | "engajado" | "aquecido" | "carrinho" | "comprador" | "perdido";

export const CRM_STATUSES: { value: CRMStatus; label: string; color: string }[] = [
  { value: "lead", label: "Lead Capturado", color: "#3B82F6" },
  { value: "engajado", label: "Engajado", color: "#8B5CF6" },
  { value: "aquecido", label: "Aquecido", color: "#F59E0B" },
  { value: "carrinho", label: "Carrinho", color: "#EC4899" },
  { value: "comprador", label: "Comprador", color: "#10B981" },
  { value: "perdido", label: "Perdido", color: "#EF4444" },
];

export interface CRMLead {
  lead_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  crm_status: string | null;
  project_slug: string | null;
  created_at: string | null;
  utm_source?: string | null;
  products?: string[];
}

export interface CRMColumn {
  value: CRMStatus;
  label: string;
  color: string;
  leads: CRMLead[];
}

export const useCRMPipeline = (productSlug?: string | null, period?: PeriodFilter) => {
  return useQuery({
    queryKey: ["crm-pipeline", productSlug, period],
    queryFn: async () => {
      const { startDate, endDate } = period
        ? calculateDateRange(period)
        : { startDate: new Date("2020-01-01"), endDate: new Date() };

      let query = supabase
        .from("leads")
        .select("lead_id, name, email, phone, source, crm_status, project_slug, created_at, utm_source")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);

      const { data, error } = await query;

      if (error) throw error;

      let filteredLeads = data || [];

      // Apply product filter if selected
      if (productSlug) {
        // Fetch campaigns with this product
        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("slug")
          .contains("products", [productSlug]);

        const campaignSlugs = campaigns?.map((c) => c.slug) || [];

        // Fetch leads with purchases of this product
        const { data: purchases } = await supabase
          .from("purchases")
          .select("lead_id")
          .eq("product_slug", productSlug);

        const leadsWithPurchase = purchases?.map((p) => p.lead_id) || [];

        // Filter leads
        filteredLeads = filteredLeads.filter(
          (lead) =>
            (lead.project_slug && campaignSlugs.includes(lead.project_slug)) ||
            leadsWithPurchase.includes(lead.lead_id)
        );
      }

      // Group by crm_status
      const pipeline: CRMColumn[] = CRM_STATUSES.map((status) => ({
        ...status,
        leads: filteredLeads
          .filter((lead) => (lead.crm_status || "lead") === status.value)
          .map((lead) => ({
            lead_id: lead.lead_id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            crm_status: lead.crm_status,
            project_slug: lead.project_slug,
            created_at: lead.created_at,
            utm_source: lead.utm_source,
          })),
      }));

      return pipeline;
    },
  });
};

export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: CRMStatus }) => {
      const { data, error } = await supabase
        .from("leads")
        .update({ crm_status: status })
        .eq("lead_id", leadId)
        .select()
        .single();

      if (error) throw error;

      // Create event
      const { error: eventError } = await supabase
        .from("lead_events")
        .insert({
          lead_id: leadId,
          event_type: "status_changed",
          event_data: { new_status: status },
          source: "crm",
        });
      if (eventError) console.error('Error creating purchase event:', eventError);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating lead status:", error);
      toast.error("Erro ao atualizar status do lead");
    },
  });
};
