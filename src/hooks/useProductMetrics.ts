import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodFilter, calculateDateRange } from "@/lib/dateUtils";

interface ProductMetrics {
  productId: string;
  productSlug: string;
  sales: number;
  revenue: number;
}

interface ProductMetricsSummary {
  totalRevenue: number;
  totalSales: number;
  averageROI: number | null;
  productMetrics: Record<string, ProductMetrics>;
}

export const useProductMetrics = (period?: PeriodFilter) => {
  return useQuery({
    queryKey: ["product-metrics", period],
    queryFn: async (): Promise<ProductMetricsSummary> => {
      const { startDate, endDate } = period 
        ? calculateDateRange(period) 
        : { startDate: new Date("2020-01-01"), endDate: new Date() };

      // Fetch all approved purchases within period
      const { data: purchases, error } = await supabase
        .from("purchases")
        .select("product_slug, product_name, value, status")
        .eq("status", "approved")
        .gte("purchase_date", startDate.toISOString())
        .lte("purchase_date", endDate.toISOString());

      if (error) {
        console.error("Error fetching purchase metrics:", error);
        throw error;
      }

      // Fetch all products to map slugs to IDs
      const { data: products } = await supabase
        .from("products")
        .select("id, slug");

      const slugToId: Record<string, string> = {};
      products?.forEach((p) => {
        slugToId[p.slug] = p.id;
      });

      // Aggregate metrics by product
      const productMetrics: Record<string, ProductMetrics> = {};
      let totalRevenue = 0;
      let totalSales = 0;

      purchases?.forEach((purchase) => {
        const slug = purchase.product_slug || "";
        const productId = slugToId[slug] || slug;

        if (!productMetrics[productId]) {
          productMetrics[productId] = {
            productId,
            productSlug: slug,
            sales: 0,
            revenue: 0,
          };
        }

        productMetrics[productId].sales += 1;
        productMetrics[productId].revenue += purchase.value || 0;
        totalRevenue += purchase.value || 0;
        totalSales += 1;
      });

      // Fetch campaign ad spend for ROI calculation
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("ad_spend");

      const totalAdSpend = campaigns?.reduce((sum, c) => sum + (c.ad_spend || 0), 0) || 0;
      const averageROI = totalAdSpend > 0 
        ? ((totalRevenue - totalAdSpend) / totalAdSpend) * 100 
        : null;

      return {
        totalRevenue,
        totalSales,
        averageROI,
        productMetrics,
      };
    },
  });
};

export const useProductMetricsById = (productId: string, period?: PeriodFilter) => {
  const { data, isLoading } = useProductMetrics(period);
  
  const metrics = data?.productMetrics[productId] || {
    productId,
    productSlug: "",
    sales: 0,
    revenue: 0,
  };

  return { metrics, isLoading };
};
