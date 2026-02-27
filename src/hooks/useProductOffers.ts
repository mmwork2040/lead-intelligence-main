import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ProductOffer = {
  id: string;
  product_id: string;
  hotmart_code: string;
  offer_name: string;
  offer_price: number;
  offer_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ProductOfferInsert = Omit<ProductOffer, "id" | "created_at" | "updated_at">;
type ProductOfferUpdate = Partial<ProductOfferInsert>;

export const useProductOffers = (productId?: string) => {
  return useQuery({
    queryKey: ["product-offers", productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from("product_offers")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProductOffer[];
    },
    enabled: !!productId,
  });
};

export const useCreateProductOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offer: ProductOfferInsert) => {
      const { data, error } = await supabase
        .from("product_offers")
        .insert(offer)
        .select()
        .single();

      if (error) throw error;
      return data as ProductOffer;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-offers", variables.product_id] });
      toast.success("Oferta adicionada com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error creating product offer:", error);
      toast.error(error.message || "Erro ao adicionar oferta");
    },
  });
};

export const useUpdateProductOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId, updates }: { id: string; productId: string; updates: ProductOfferUpdate }) => {
      const { data, error } = await supabase
        .from("product_offers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as ProductOffer, productId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["product-offers", result.productId] });
      toast.success("Oferta atualizada com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error updating product offer:", error);
      toast.error(error.message || "Erro ao atualizar oferta");
    },
  });
};

export const useDeleteProductOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from("product_offers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      queryClient.invalidateQueries({ queryKey: ["product-offers", productId] });
      toast.success("Oferta excluída com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error deleting product offer:", error);
      toast.error(error.message || "Erro ao excluir oferta");
    },
  });
};

export const useProductByHotmartCode = (hotmartCode?: string) => {
  return useQuery({
    queryKey: ["product-by-hotmart-code", hotmartCode],
    queryFn: async () => {
      if (!hotmartCode) return null;
      
      const { data, error } = await supabase
        .from("product_offers")
        .select("product_id, products(slug, name)")
        .eq("hotmart_code", hotmartCode)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }
      
      return data;
    },
    enabled: !!hotmartCode,
  });
};
