import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/lib/utils/slugify";

export type UnlinkedPurchase = {
  product_name: string;
  count: number;
  total_value: number;
};

// Hook para buscar compras sem product_slug
export const useUnlinkedPurchases = () => {
  return useQuery({
    queryKey: ["unlinked-purchases"],
    queryFn: async (): Promise<UnlinkedPurchase[]> => {
      const { data: purchases, error } = await supabase
        .from("purchases")
        .select("product_name, value")
        .is("product_slug", null)
        .not("product_name", "is", null);

      if (error) throw error;

      // Agrupar por product_name
      const grouped: Record<string, { count: number; total_value: number }> = {};
      
      purchases?.forEach((p) => {
        const name = p.product_name;
        if (!grouped[name]) {
          grouped[name] = { count: 0, total_value: 0 };
        }
        grouped[name].count++;
        grouped[name].total_value += Number(p.value) || 0;
      });

      return Object.entries(grouped).map(([name, data]) => ({
        product_name: name,
        count: data.count,
        total_value: data.total_value,
      }));
    },
  });
};

// Hook para processar e criar produtos automaticamente
export const useProcessExistingProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // 1. Buscar compras sem product_slug
      const { data: purchases, error: fetchError } = await supabase
        .from("purchases")
        .select("product_name, value")
        .is("product_slug", null)
        .not("product_name", "is", null);

      if (fetchError) throw fetchError;

      if (!purchases || purchases.length === 0) {
        return { productsCreated: 0, purchasesUpdated: 0 };
      }

      // 2. Agrupar por product_name único
      const uniqueProducts = [...new Set(purchases.map((p) => p.product_name))];
      let productsCreated = 0;
      let purchasesUpdated = 0;

      // 3. Para cada produto único
      for (const productName of uniqueProducts) {
        let productSlug: string | null = null;
        let existingProduct = null;
        
        // Try exact name match
        const { data: exactMatch } = await supabase
          .from("products")
          .select("id, slug, metadata")
          .ilike("name", productName)
          .maybeSingle();
        
        if (exactMatch) {
          existingProduct = exactMatch;
          productSlug = exactMatch.slug;
        }
        
        // Try alias matching if no exact match
        if (!existingProduct) {
          const { data: allProducts } = await supabase
            .from("products")
            .select("id, slug, metadata")
            .eq("is_active", true);
          
          if (allProducts) {
            const normalizedName = productName.toLowerCase().trim();
            
            for (const product of allProducts) {
              const metadata = product.metadata as Record<string, any> || {};
              const aliases: string[] = metadata.aliases || [];
              
              // Check if product name matches any alias
              const matchedAlias = aliases.find(alias => 
                alias.toLowerCase() === normalizedName ||
                normalizedName.includes(alias.toLowerCase()) ||
                alias.toLowerCase().includes(normalizedName)
              );
              
              if (matchedAlias) {
                existingProduct = product;
                productSlug = product.slug;
                break;
              }
            }
          }
        }
        
        // Try keyword matching if still no match
        if (!existingProduct) {
          const { data: allProducts } = await supabase
            .from("products")
            .select("id, slug, name")
            .eq("is_active", true);
          
          if (allProducts) {
            const normalizedName = productName.toLowerCase();
            const keywords = normalizedName.split(/\s+/).filter(w => w.length >= 4);
            
            for (const product of allProducts) {
              const productNameLower = product.name.toLowerCase();
              const matchingKeywords = keywords.filter(kw => productNameLower.includes(kw));
              const threshold = Math.max(2, Math.floor(keywords.length * 0.5));
              
              if (matchingKeywords.length >= threshold) {
                existingProduct = product;
                productSlug = product.slug;
                break;
              }
            }
          }
        }

        if (!existingProduct) {
          // Criar produto automaticamente
          const baseSlug = slugify(productName);
          
          // Verificar se slug já existe
          const { data: slugExists } = await supabase
            .from("products")
            .select("id")
            .eq("slug", baseSlug)
            .maybeSingle();

          productSlug = slugExists ? `${baseSlug}-${Date.now()}` : baseSlug;

          // Calcular preço médio das compras deste produto
          const productPurchases = purchases.filter((p) => p.product_name === productName);
          const avgValue = productPurchases.reduce((sum, p) => sum + (Number(p.value) || 0), 0) / productPurchases.length;

          const { error: insertError } = await supabase
            .from("products")
            .insert({
              name: productName,
              slug: productSlug,
              type: "curso",
              price: avgValue || 0,
              is_active: true,
              metadata: { source: "migration", auto_created: true },
            });

          if (insertError) {
            console.error(`Error creating product ${productName}:`, insertError);
            continue;
          }

          productsCreated++;
        }

        // 4. Atualizar todas as compras com este product_name
        const { data: updated, error: updateError } = await supabase
          .from("purchases")
          .update({ product_slug: productSlug })
          .ilike("product_name", productName)
          .is("product_slug", null)
          .select("id");

        if (updateError) {
          console.error(`Error updating purchases for ${productName}:`, updateError);
        } else {
          purchasesUpdated += updated?.length || 0;
        }
      }

      return { productsCreated, purchasesUpdated };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["unlinked-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });

      toast.success(
        `Migração concluída! ${result.productsCreated} produtos criados, ${result.purchasesUpdated} compras atualizadas.`
      );
    },
    onError: (error: any) => {
      console.error("Error processing existing products:", error);
      toast.error(error.message || "Erro ao processar produtos");
    },
  });
};
