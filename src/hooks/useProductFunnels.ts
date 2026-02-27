import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FunnelStage {
  label: string;
  count: number;
  percentage?: number;
  color: string;
}

interface ProductFunnelData {
  productSlug: string;
  productName: string;
  stages: FunnelStage[];
  totalRevenue: number;
  conversionRate: string;
}

const STAGE_COLORS = {
  lead: 'hsl(var(--chart-1))',
  engajado: 'hsl(var(--chart-2))',
  aquecido: 'hsl(var(--chart-3))',
  carrinho: 'hsl(var(--chart-4))',
  comprador: 'hsl(var(--chart-5))',
};

export const useProductFunnels = () => {
  return useQuery({
    queryKey: ["product-funnels"],
    queryFn: async (): Promise<ProductFunnelData[]> => {
      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, slug, name")
        .eq("is_active", true);

      if (productsError) throw productsError;
      if (!products || products.length === 0) return [];

      // Fetch all leads with their CRM status
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("lead_id, crm_status");

      if (leadsError) throw leadsError;

      // Fetch purchases with product association
      const { data: purchases, error: purchasesError } = await supabase
        .from("purchases")
        .select("lead_id, product_slug, status, value");

      if (purchasesError) throw purchasesError;

      // Build funnel data for each product
      return products.map((product) => {
        const productPurchases = purchases?.filter(p => p.product_slug === product.slug) || [];
        const productLeadIds = new Set(productPurchases.map(p => p.lead_id));
        const productLeads = leads?.filter(l => productLeadIds.has(l.lead_id)) || [];

        const leadCount = productLeads.filter(l => l.crm_status === 'lead').length;
        const engajadoCount = productLeads.filter(l => 
          ['engajado', 'aquecido', 'carrinho', 'comprador'].includes(l.crm_status || '')
        ).length;
        const aquecidoCount = productLeads.filter(l => 
          ['aquecido', 'carrinho', 'comprador'].includes(l.crm_status || '')
        ).length;
        const carrinhoCount = productLeads.filter(l => 
          ['carrinho', 'comprador'].includes(l.crm_status || '')
        ).length;

        const approvedSales = productPurchases.filter(p => p.status === 'approved');
        const totalRevenue = approvedSales.reduce((sum, p) => sum + (p.value || 0), 0);
        const totalLeads = productLeads.length;
        const conversionRate = totalLeads > 0 
          ? ((approvedSales.length / totalLeads) * 100).toFixed(1) 
          : '0.0';

        const stages: FunnelStage[] = [
          { label: 'LEADS', count: totalLeads, color: STAGE_COLORS.lead },
          { label: 'ENGAJADOS', count: engajadoCount, percentage: totalLeads > 0 ? (engajadoCount / totalLeads) * 100 : 0, color: STAGE_COLORS.engajado },
          { label: 'AQUECIDOS', count: aquecidoCount, percentage: engajadoCount > 0 ? (aquecidoCount / engajadoCount) * 100 : 0, color: STAGE_COLORS.aquecido },
          { label: 'CARRINHO', count: carrinhoCount, percentage: aquecidoCount > 0 ? (carrinhoCount / aquecidoCount) * 100 : 0, color: STAGE_COLORS.carrinho },
          { label: 'VENDAS', count: approvedSales.length, percentage: carrinhoCount > 0 ? (approvedSales.length / carrinhoCount) * 100 : 0, color: STAGE_COLORS.comprador },
        ];

        return {
          productSlug: product.slug,
          productName: product.name,
          stages,
          totalRevenue,
          conversionRate,
        };
      });
    },
  });
};
