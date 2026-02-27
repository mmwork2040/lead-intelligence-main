import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientSummary {
  totalValue: number;
  totalPurchases: number;
  products: string[];
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
  isRecurringClient: boolean;
  averageTicket: number;
}

export const useClientSummary = (leadId: string) => {
  return useQuery({
    queryKey: ["client-summary", leadId],
    queryFn: async () => {
      const { data: purchases, error } = await supabase
        .from("purchases")
        .select("value, product_name, purchase_date, status, payment_method")
        .eq("lead_id", leadId)
        .in("status", ["approved", "completed"])
        .order("purchase_date", { ascending: true });

      if (error) throw error;

      const totalValue = purchases?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;
      const productsList = [...new Set(purchases?.map(p => p.product_name) || [])];
      const firstPurchase = purchases?.[0]?.purchase_date || null;
      const lastPurchase = purchases?.[purchases.length - 1]?.purchase_date || null;
      const totalPurchases = purchases?.length || 0;
      const averageTicket = totalPurchases > 0 ? totalValue / totalPurchases : 0;

      return {
        totalValue,
        totalPurchases,
        products: productsList,
        firstPurchaseDate: firstPurchase,
        lastPurchaseDate: lastPurchase,
        isRecurringClient: totalPurchases > 1,
        averageTicket,
      } as ClientSummary;
    },
    enabled: !!leadId,
  });
};
