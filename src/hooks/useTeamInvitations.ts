import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TeamInvitation {
  id: string;
  token: string;
  email: string;
  role: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
}

export const useTeamInvitations = () => {
  return useQuery({
    queryKey: ["team-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invitations" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as TeamInvitation[];
    },
  });
};

export const useCreateInvitation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data, error } = await supabase
        .from("team_invitations" as any)
        .insert({
          email: email.toLowerCase().trim(),
          role,
          created_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as TeamInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      toast.success("Convite criado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error creating invitation:", error);
      toast.error("Erro ao criar convite");
    },
  });
};

export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_invitations" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      toast.success("Convite removido");
    },
    onError: () => {
      toast.error("Erro ao remover convite");
    },
  });
};

export const useValidateInvitation = (token: string | null) => {
  return useQuery({
    queryKey: ["invitation-validate", token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase
        .from("team_invitations" as any)
        .select("*")
        .eq("token", token)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      return data as unknown as TeamInvitation | null;
    },
    enabled: !!token,
  });
};
