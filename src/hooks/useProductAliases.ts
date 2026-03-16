import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ProductAlias = {
  id: string;
  alias_name: string;
  created_at: string;
};

// Hook para buscar aliases de um produto (armazenados no metadata)
export const useProductAliases = (productId?: string) => {
  return useQuery({
    queryKey: ["product-aliases", productId],
    queryFn: async (): Promise<ProductAlias[]> => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from("products")
        .select("metadata")
        .eq("id", productId)
        .single();

      if (error) throw error;
      
      // Extract aliases from metadata
      const metadata = data?.metadata as Record<string, any> || {};
      const aliases: string[] = metadata.aliases || [];
      
      return aliases.map((alias, index) => ({
        id: `${productId}-${index}`,
        alias_name: alias,
        created_at: new Date().toISOString(),
      }));
    },
    enabled: !!productId,
  });
};

// Hook para criar um alias (armazenado no metadata)
export const useCreateProductAlias = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, aliasName }: { productId: string; aliasName: string }) => {
      // Buscar metadata atual
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("metadata")
        .eq("id", productId)
        .single();

      if (fetchError) throw fetchError;

      const metadata = (product?.metadata as Record<string, any>) || {};
      const aliases: string[] = metadata.aliases || [];
      
      // Adicionar novo alias se não existir
      const normalizedAlias = aliasName.trim();
      if (!aliases.some(a => a.toLowerCase() === normalizedAlias.toLowerCase())) {
        aliases.push(normalizedAlias);
      }

      // Atualizar metadata
      const { error } = await supabase
        .from("products")
        .update({ 
          metadata: { ...metadata, aliases } 
        })
        .eq("id", productId);

      if (error) throw error;
      return { productId, aliasName: normalizedAlias };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-aliases", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Alias adicionado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating alias:", error);
      toast.error(error.message || "Erro ao criar alias");
    },
  });
};

// Hook para deletar um alias
export const useDeleteProductAlias = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, aliasName }: { productId: string; aliasName: string }) => {
      // Buscar metadata atual
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("metadata")
        .eq("id", productId)
        .single();

      if (fetchError) throw fetchError;

      const metadata = (product?.metadata as Record<string, any>) || {};
      const aliases: string[] = metadata.aliases || [];
      
      // Remover alias
      const filteredAliases = aliases.filter(
        a => a.toLowerCase() !== aliasName.toLowerCase()
      );

      // Atualizar metadata
      const { error } = await supabase
        .from("products")
        .update({ 
          metadata: { ...metadata, aliases: filteredAliases } 
        })
        .eq("id", productId);

      if (error) throw error;
      return { productId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-aliases", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Alias removido!");
    },
    onError: (error: Error) => {
      console.error("Error deleting alias:", error);
      toast.error(error.message || "Erro ao remover alias");
    },
  });
};
