import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Transaction {
  id: string;
  lead_id: string;
  product_name: string;
  product_slug?: string | null;
  value: number | null;
  gross_value?: number | null;
  status: string;
  payment_method?: string | null;
  installments?: number | null;
  purchase_date?: string | null;
  source?: string | null;
  utm_source?: string | null;
  leads?: { 
    name: string | null; 
    email: string | null;
    phone?: string | null;
    cpf?: string | null;
    source?: string | null;
    utm_source?: string | null;
  } | null;
  invoice_requests?: { id: string; status: string }[] | null;
}

export const useTransactions = (page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ["transactions", page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("purchases")
        .select(`
          *,
          leads!purchases_lead_id_fkey (name, email, phone, cpf, source, utm_source),
          invoice_requests (id, status)
        `, { count: "exact" })
        .order("purchase_date", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        transactions: data || [],
        total: count || 0,
      };
    },
  });
};
