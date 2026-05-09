import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

export type LeadVersion = Database["public"]["Tables"]["lead_versions"]["Row"];
export type LeadVersionData = any; // JSON field, can keep as any or define more strictly if needed

export const useLeadVersions = (leadId: string) => {
  return useQuery({
    queryKey: ["lead-versions", leadId],
    queryFn: async () => {
      try {
        const result = await supabase
          .from("lead_versions")
          .select("*")
          .eq("lead_id", leadId)
          .order("version_number", { ascending: false });

        if (result.error) {
          console.warn("Error fetching lead versions:", result.error.message);
          return [] as LeadVersion[];
        }

        return result.data as LeadVersion[];
      } catch (err) {
        console.warn("Error fetching lead versions:", err);
        return [] as LeadVersion[];
      }
    },
    enabled: !!leadId,
  });
};

export const useCreateLeadVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      leadData,
      changeSummary,
    }: {
      leadId: string;
      leadData: LeadVersionData;
      changeSummary?: string;
    }) => {
      // Get the current max version number
      const { data: existingVersions } = await supabase
        .from("lead_versions")
        .select("version_number")
        .eq("lead_id", leadId)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = existingVersions && existingVersions.length > 0 
        ? (existingVersions[0].version_number || 0) + 1 
        : 1;

      const { data: session } = await supabase.auth.getSession();

      const { data, error } = await supabase
        .from("lead_versions")
        .insert({
          lead_id: leadId,
          version_number: nextVersion,
          data: leadData,
          changed_by: session?.session?.user?.id || null,
          change_summary: changeSummary || null,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-versions", variables.leadId] });
    },
  });
};

export const useRestoreLeadVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      versionData,
    }: {
      leadId: string;
      versionData: LeadVersionData;
    }) => {
      // First, save current state as a new version before restoring
      const { data: currentLead } = await supabase
        .from("leads")
        .select("*")
        .eq("lead_id", leadId)
        .single();

      if (currentLead) {
        // Get max version
        const { data: existingVersions } = await supabase
          .from("lead_versions")
          .select("version_number")
          .eq("lead_id", leadId)
          .order("version_number", { ascending: false })
          .limit(1);

        const nextVersion = existingVersions && existingVersions.length > 0 
          ? (existingVersions[0].version_number || 0) + 1 
          : 1;

        const { data: session } = await supabase.auth.getSession();

        // Save current state before overwriting
        await supabase.from("lead_versions").insert({
          lead_id: leadId,
          version_number: nextVersion,
          data: currentLead as any,
          changed_by: session?.session?.user?.id || null,
          change_summary: "Estado antes da restauração",
        });
      }

      // Remove internal fields that shouldn't be updated
      const { id, lead_id, created_at, ...updateData } = versionData;

      // Restore the lead to the selected version
      const { data, error } = await supabase
        .from("leads")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("lead_id", leadId)
        .select()
        .single();

      if (error) throw error;

      // Create event for restoration
      await supabase.from("lead_events").insert({
        lead_id: leadId,
        event_type: "lead_restored",
        source: "manual",
        event_data: { restored_from: "version" },
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-versions", variables.leadId] });
      toast.success("Lead restaurado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error restoring lead:", error);
      toast.error("Erro ao restaurar lead");
    },
  });
};
