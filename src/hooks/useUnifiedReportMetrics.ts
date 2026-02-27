import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodFilter, calculateDateRange } from "@/lib/dateUtils";
import { subDays } from "date-fns";

export interface ProductMetric {
  productId: string;
  productName: string;
  productSlug: string;
  leads: number;
  sales: number;
  revenue: number;
  conversionRate: string;
}

export interface CampaignMetric {
  campaignId: string;
  campaignSlug: string;
  campaignName: string;
  leads: number;
  sales: number;
  revenue: number;
  investment: number;
  roas: string;
}

export interface SourceMetric {
  source: string;
  leads: number;
  sales: number;
  revenue: number;
  conversion: string;
}

export interface DailyData {
  date: string;
  leads: number;
  sales: number;
  revenue: number;
}

export interface UnifiedReportMetrics {
  // Métricas gerais
  totalLeads: number;
  totalSales: number;
  totalRevenue: number;
  totalAdSpend: number;
  roas: string;
  conversionRate: string;
  
  // Comparações com período anterior
  leadsChange: number;
  salesChange: number;
  revenueChange: number;
  
  // Por produto
  productMetrics: ProductMetric[];
  
  // Por campanha
  campaignMetrics: CampaignMetric[];
  
  // Por origem
  sourceMetrics: SourceMetric[];
  
  // Dados para gráficos
  dailyData: DailyData[];
}

export const useUnifiedReportMetrics = (period: PeriodFilter) => {
  return useQuery({
    queryKey: ["unified-report-metrics", period],
    queryFn: async (): Promise<UnifiedReportMetrics> => {
      const { startDate, endDate } = calculateDateRange(period);
      
      // Calculate previous period for comparison
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevStartDate = subDays(startDate, periodDays);
      const prevEndDate = subDays(endDate, periodDays);

      // Fetch all data in parallel
      const [
        leadsResult,
        purchasesResult,
        campaignsResult,
        productsResult,
        fbMetricsResult,
        prevLeadsResult,
        prevPurchasesResult
      ] = await Promise.all([
        // Current period leads
        supabase
          .from("leads")
          .select("id, lead_id, created_at, utm_source, utm_campaign, project_slug")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        
        // Current period purchases
        supabase
          .from("purchases")
          .select("id, lead_id, product_name, product_slug, value, status, purchase_date, utm_campaign, utm_source")
          .gte("purchase_date", startDate.toISOString())
          .lte("purchase_date", endDate.toISOString()),
        
        // Campaigns
        supabase
          .from("campaigns")
          .select("id, name, slug, ad_spend, is_active"),
        
        // Products
        supabase
          .from("products")
          .select("id, name, slug, price, is_active"),
        
        // Facebook metrics
        supabase
          .from("fb_metrics")
          .select("spend, fb_campaign_id, date_start")
          .gte("date_start", startDate.toISOString().split("T")[0])
          .lte("date_start", endDate.toISOString().split("T")[0]),
        
        // Previous period leads
        supabase
          .from("leads")
          .select("id")
          .gte("created_at", prevStartDate.toISOString())
          .lte("created_at", prevEndDate.toISOString()),
        
        // Previous period purchases
        supabase
          .from("purchases")
          .select("id, value, status")
          .gte("purchase_date", prevStartDate.toISOString())
          .lte("purchase_date", prevEndDate.toISOString())
      ]);

      const leads = leadsResult.data || [];
      const purchases = purchasesResult.data || [];
      const campaigns = campaignsResult.data || [];
      const products = productsResult.data || [];
      const fbMetrics = fbMetricsResult.data || [];
      const prevLeads = prevLeadsResult.data || [];
      const prevPurchases = prevPurchasesResult.data || [];

      // Calculate totals
      const approvedPurchases = purchases.filter(p => p.status === "approved" || p.status === "completed");
      const totalLeads = leads.length;
      const totalSales = approvedPurchases.length;
      const totalRevenue = approvedPurchases.reduce((sum, p) => sum + (p.value || 0), 0);
      const totalAdSpend = fbMetrics.reduce((sum, m) => sum + (m.spend || 0), 0);
      const roas = totalAdSpend > 0 ? (totalRevenue / totalAdSpend).toFixed(2) : "0.00";
      const conversionRate = totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : "0.0";

      // Previous period comparison
      const prevApprovedPurchases = prevPurchases.filter(p => p.status === "approved" || p.status === "completed");
      const prevTotalLeads = prevLeads.length;
      const prevTotalSales = prevApprovedPurchases.length;
      const prevTotalRevenue = prevApprovedPurchases.reduce((sum, p) => sum + (p.value || 0), 0);

      const leadsChange = prevTotalLeads > 0 ? ((totalLeads - prevTotalLeads) / prevTotalLeads) * 100 : 0;
      const salesChange = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
      const revenueChange = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;

      // Product metrics
      const productMap = new Map<string, ProductMetric>();
      products.forEach(product => {
        productMap.set(product.slug, {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          leads: 0,
          sales: 0,
          revenue: 0,
          conversionRate: "0.0"
        });
      });

      // Count leads by product (project_slug)
      leads.forEach(lead => {
        if (lead.project_slug && productMap.has(lead.project_slug)) {
          const pm = productMap.get(lead.project_slug)!;
          pm.leads++;
        }
      });

      // Count sales by product
      approvedPurchases.forEach(purchase => {
        const slug = purchase.product_slug;
        if (slug && productMap.has(slug)) {
          const pm = productMap.get(slug)!;
          pm.sales++;
          pm.revenue += purchase.value || 0;
        }
      });

      // Calculate conversion rates
      productMap.forEach(pm => {
        pm.conversionRate = pm.leads > 0 ? ((pm.sales / pm.leads) * 100).toFixed(1) : "0.0";
      });

      const productMetrics = Array.from(productMap.values())
        .filter(pm => pm.leads > 0 || pm.sales > 0)
        .sort((a, b) => b.revenue - a.revenue);

      // Campaign metrics
      const campaignMap = new Map<string, CampaignMetric>();
      campaigns.forEach(campaign => {
        campaignMap.set(campaign.slug, {
          campaignId: campaign.id,
          campaignSlug: campaign.slug,
          campaignName: campaign.name,
          leads: 0,
          sales: 0,
          revenue: 0,
          investment: campaign.ad_spend || 0,
          roas: "0.00"
        });
      });

      // Count leads by campaign
      leads.forEach(lead => {
        if (lead.utm_campaign && campaignMap.has(lead.utm_campaign)) {
          const cm = campaignMap.get(lead.utm_campaign)!;
          cm.leads++;
        }
      });

      // Count sales by campaign
      approvedPurchases.forEach(purchase => {
        if (purchase.utm_campaign && campaignMap.has(purchase.utm_campaign)) {
          const cm = campaignMap.get(purchase.utm_campaign)!;
          cm.sales++;
          cm.revenue += purchase.value || 0;
        }
      });

      // Calculate ROAS
      campaignMap.forEach(cm => {
        cm.roas = cm.investment > 0 ? (cm.revenue / cm.investment).toFixed(2) : "0.00";
      });

      const campaignMetrics = Array.from(campaignMap.values())
        .filter(cm => cm.leads > 0 || cm.sales > 0 || cm.investment > 0)
        .sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas));

      // Source metrics
      const sourceMap = new Map<string, SourceMetric>();
      
      leads.forEach(lead => {
        const source = lead.utm_source || "direto";
        if (!sourceMap.has(source)) {
          sourceMap.set(source, { source, leads: 0, sales: 0, revenue: 0, conversion: "0.0" });
        }
        sourceMap.get(source)!.leads++;
      });

      approvedPurchases.forEach(purchase => {
        const source = purchase.utm_source || "direto";
        if (!sourceMap.has(source)) {
          sourceMap.set(source, { source, leads: 0, sales: 0, revenue: 0, conversion: "0.0" });
        }
        const sm = sourceMap.get(source)!;
        sm.sales++;
        sm.revenue += purchase.value || 0;
      });

      sourceMap.forEach(sm => {
        sm.conversion = sm.leads > 0 ? ((sm.sales / sm.leads) * 100).toFixed(1) : "0.0";
      });

      const sourceMetrics = Array.from(sourceMap.values())
        .sort((a, b) => b.leads - a.leads);

      // Daily data for charts
      const dailyMap = new Map<string, DailyData>();
      
      leads.forEach(lead => {
        const date = new Date(lead.created_at!).toISOString().split("T")[0];
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { date, leads: 0, sales: 0, revenue: 0 });
        }
        dailyMap.get(date)!.leads++;
      });

      approvedPurchases.forEach(purchase => {
        const date = new Date(purchase.purchase_date!).toISOString().split("T")[0];
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { date, leads: 0, sales: 0, revenue: 0 });
        }
        const dd = dailyMap.get(date)!;
        dd.sales++;
        dd.revenue += purchase.value || 0;
      });

      const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalLeads,
        totalSales,
        totalRevenue,
        totalAdSpend,
        roas,
        conversionRate,
        leadsChange,
        salesChange,
        revenueChange,
        productMetrics,
        campaignMetrics,
        sourceMetrics,
        dailyData
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
