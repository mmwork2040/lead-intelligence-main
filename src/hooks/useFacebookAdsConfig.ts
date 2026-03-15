import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface FacebookAdsConfig {
  id: string;
  access_token: string;
  ad_account_id: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useFacebookAdsConfig = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["fb-ads-config", user?.id],
    queryFn: async () => {
      let query = supabase
        .from("fb_ads_config")
        .select("*")
        .eq("is_active", true);

      if (user?.id) {
        query = query.eq("user_id" as any, user.id);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as FacebookAdsConfig | null;
    },
  });
};

export const useSaveFacebookAdsConfig = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      accessToken,
      adAccountId,
      existingConfigId,
    }: {
      accessToken: string;
      adAccountId: string;
      existingConfigId?: string;
    }) => {
      if (existingConfigId) {
        const updateData: Record<string, string> = { ad_account_id: adAccountId };

        if (accessToken !== "••••••••••••••••") {
          updateData.access_token = accessToken;
        }

        const { data, error } = await supabase
          .from("fb_ads_config")
          .update(updateData)
          .eq("id", existingConfigId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const insertData: Record<string, unknown> = {
          access_token: accessToken,
          ad_account_id: adAccountId,
          is_active: true,
        };
        if (user?.id) insertData.user_id = user.id;

        const { data, error } = await supabase
          .from("fb_ads_config")
          .insert(insertData as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["fb-ads-config"] });
      toast.success("Configuração salva! Sincronizando dados do Facebook...");

      // Auto-sync after saving config
      try {
        const { error } = await supabase.functions.invoke("sync-facebook-ads");
        if (error) throw error;

        toast.success("Dados do Facebook sincronizados com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["facebook-ads-hierarchical-reports"] });
        queryClient.invalidateQueries({ queryKey: ["facebook-campaigns"] });
        queryClient.invalidateQueries({ queryKey: ["facebook-adsets"] });
        queryClient.invalidateQueries({ queryKey: ["facebook-ads"] });
        queryClient.invalidateQueries({ queryKey: ["facebook-metrics"] });
      } catch (syncError: unknown) {
        console.error("Sync error:", syncError);
        const errorMessage = syncError instanceof Error ? syncError.message : "Erro desconhecido";
        toast.error("Configuração salva, mas erro ao sincronizar: " + errorMessage);
      }
    },
    onError: (error: any) => {
      console.error("Error saving config:", error);
      toast.error("Erro ao salvar configuração: " + error.message);
    },
  });
};

export const useTestFacebookConnection = () => {
  return useMutation({
    mutationFn: async ({ accessToken, adAccountId }: { accessToken: string; adAccountId: string }) => {
      const { data, error } = await supabase.functions.invoke("test-facebook-connection", {
        body: { accessToken, adAccountId },
      });

      if (error) throw error;

      // Check if the response indicates failure
      if (data && !data.success) {
        throw new Error(data.message || data.error || "Teste de conexão falhou");
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("✅ Conexão testada com sucesso!", {
          description: `Account: ${data.account_name || 'N/A'} • Status: ${data.account_status || 'Ativa'}`,
          duration: 5000,
        });
      }
    },
    onError: (error: any) => {
      console.error("Error testing connection:", error);
      const errorMsg = error.message || "Erro desconhecido";

      // Check if it's a permission error
      if (errorMsg.includes("permissões") || errorMsg.includes("permission")) {
        toast.error("❌ Token sem permissões necessárias", {
          description: "Gere um NOVO token no Graph API Explorer com ads_read e ads_management marcadas. Veja o card de ajuda azul abaixo para instruções detalhadas.",
          duration: 8000,
        });
      } else {
        toast.error("❌ Falha no teste de conexão", {
          description: errorMsg,
          duration: 6000,
        });
      }
    },
  });
};

export interface SyncOptions {
  syncMode: "quick" | "full";
  daysBack?: number;
  skipAds?: boolean;
  activeOnly?: boolean;
}

export const useSyncFacebookAds = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: SyncOptions) => {
      const syncOptions = options || { syncMode: "quick" };

      const { data, error } = await supabase.functions.invoke("sync-facebook-ads", {
        body: syncOptions,
      });

      if (error) throw error;

      // Check if the response indicates an error
      if (data && !data.success) {
        const err = new Error(data.error || "Erro ao sincronizar");
        (err as any).isExpired = data.isExpired;
        (err as any).code = data.code;
        throw err;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fb-ads-config"] });
      queryClient.invalidateQueries({ queryKey: ["facebook-ads-hierarchical-reports"] });
      queryClient.invalidateQueries({ queryKey: ["facebook-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["facebook-adsets"] });
      queryClient.invalidateQueries({ queryKey: ["facebook-ads"] });
      queryClient.invalidateQueries({ queryKey: ["facebook-metrics"] });

      const mode = data?.sync_mode === "full" ? "completa" : "rápida";
      const duration = data?.duration_seconds ? ` em ${data.duration_seconds}s` : "";

      toast.success(`Sincronização ${mode} concluída${duration}!`, {
        description: `${data?.campaigns_synced || 0} campanhas, ${data?.adsets_synced || 0} conjuntos, ${data?.insights_synced || 0} métricas`,
      });
    },
    onError: (error: any) => {
      console.error("Error syncing:", error);
      const errorMsg = error.message || "Erro desconhecido";

      if (error.isExpired || errorMsg.toLowerCase().includes("expired") || errorMsg.toLowerCase().includes("expirado")) {
        toast.error("Token do Facebook expirado", {
          description: "Atualize o token na página de Integrações",
          duration: 8000,
        });
      } else {
        toast.error("Erro ao sincronizar Facebook Ads", {
          description: errorMsg,
          duration: 6000,
        });
      }
    },
  });
};
