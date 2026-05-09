import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

export type UserMCPConfig = Database["public"]["Tables"]["user_mcp_configs"]["Row"];

export const useUserMCPConfigs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-mcp-configs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_mcp_configs")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useSaveMCPConfig = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (config: Omit<Database["public"]["Tables"]["user_mcp_configs"]["Insert"], "user_id">) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("user_mcp_configs")
        .upsert({
          ...config,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-mcp-configs"] });
      toast.success("Configuração MCP salva com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar MCP: " + error.message);
    },
  });
};
