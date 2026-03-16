import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentUserId } from "@/lib/getCurrentUserId";
import type { Database } from "@/integrations/supabase/types";

type InvoiceRequest = Database["public"]["Tables"]["invoice_requests"]["Row"];
type InvoiceRequestInsert = Database["public"]["Tables"]["invoice_requests"]["Insert"];

export interface InvoiceRequestWithPurchase extends InvoiceRequest {
  purchases?: {
    product_name: string;
    purchase_date: string;
    payment_method?: string;
    value?: number;
  } | null;
  leads?: {
    name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    street?: string;
    street_number?: string;
    neighborhood?: string;
  } | null;
}

export const useInvoiceRequests = (filters?: {
  status?: string;
  startDate?: string; // formato ISO: YYYY-MM-DD
  endDate?: string;   // formato ISO: YYYY-MM-DD
  productName?: string;
}) => {
  return useQuery({
    queryKey: ["invoice-requests", filters],
    queryFn: async () => {
      let query = supabase
        .from("invoice_requests")
        .select(`
          *,
          purchases!invoice_requests_purchase_id_fkey (
            product_name,
            purchase_date,
            payment_method,
            value
          ),
          leads!invoice_requests_lead_id_fkey (
            name,
            email,
            phone,
            cpf,
            city,
            state,
            zip_code,
            street,
            street_number,
            neighborhood
          )
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data || [];

      // Filtrar por período de datas (usando purchase_date da compra)
      if (filters?.startDate || filters?.endDate) {
        filteredData = filteredData.filter((req) => {
          const purchaseDate = req.purchases?.purchase_date;
          if (!purchaseDate) return false;
          const date = new Date(purchaseDate);

          if (filters.startDate && date < new Date(filters.startDate)) return false;
          if (filters.endDate) {
            const endOfDay = new Date(filters.endDate);
            endOfDay.setHours(23, 59, 59, 999);
            if (date > endOfDay) return false;
          }

          return true;
        });
      }

      // Filtrar por produto
      if (filters?.productName && filters.productName !== "all") {
        filteredData = filteredData.filter(
          (req) => req.purchases?.product_name === filters.productName
        );
      }

      return filteredData as InvoiceRequestWithPurchase[];
    },
  });
};

export const useCreateInvoiceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceRequest: InvoiceRequestInsert) => {
      const user_id = await getCurrentUserId();
      const { data, error } = await supabase
        .from("invoice_requests")
        .insert({ ...invoiceRequest, user_id } as any)
        .select()
        .single();

      if (error) throw error;
      return data as InvoiceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-requests"] });
      toast.success("Pedido de NF enviado para o financeiro!");
    },
    onError: (error: Error) => {
      console.error("Error creating invoice request:", error);
      toast.error(error.message || "Erro ao enviar pedido de NF");
    },
  });
};

export const useUpdateInvoiceRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const updates: any = { status };
      if (status === "sent") {
        updates.sent_at = new Date().toISOString();
      } else if (status === "issued") {
        updates.issued_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("invoice_requests")
        .update(updates)
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-requests"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error updating invoice request status:", error);
      toast.error(error.message || "Erro ao atualizar status");
    },
  });
};

export const useDeleteInvoiceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invoice_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-requests"] });
      toast.success("Pedido de NF excluído!");
    },
    onError: (error: Error) => {
      console.error("Error deleting invoice request:", error);
      toast.error(error.message || "Erro ao excluir pedido");
    },
  });
};
