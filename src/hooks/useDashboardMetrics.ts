import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { PeriodFilter, calculateDateRange } from "@/lib/dateUtils";
import { useIsDemo } from "@/contexts/DemoContext";
import { demoDashboardMetrics } from "@/services/demoData";

export interface DashboardFilters {
  period: PeriodFilter;
  campaignSlug?: string | null;
  productSlug?: string | null;
}

export const useDashboardMetrics = (filters: DashboardFilters = { period: { type: "30d" } }) => {
  const isDemo = useIsDemo();

  return useQuery({
    queryKey: ["dashboard-metrics", isDemo, filters.period, filters.campaignSlug, filters.productSlug],
    queryFn: async () => {
      if (isDemo) return demoDashboardMetrics;

      const { period, campaignSlug, productSlug } = filters;
      const { startDate, endDate } = calculateDateRange(period);

      // Calculate previous period of same duration for comparison
      const periodDuration = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodDuration);
      const previousEndDate = new Date(startDate.getTime() - 1);

      // Build dynamic queries based on filters
      let leadsCurrentQuery = supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      let leadsPreviousQuery = supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", previousStartDate.toISOString())
        .lte("created_at", previousEndDate.toISOString());

      let purchasesCurrentQuery = supabase
        .from("purchases")
        .select("value, status, purchase_date, product_name, product_slug, utm_source")
        .gte("purchase_date", startDate.toISOString())
        .lte("purchase_date", endDate.toISOString());

      let purchasesPreviousQuery = supabase
        .from("purchases")
        .select("value, status")
        .eq("status", "approved")
        .gte("purchase_date", previousStartDate.toISOString())
        .lte("purchase_date", previousEndDate.toISOString());

      let leadsDataQuery = supabase
        .from("leads")
        .select("created_at, utm_source, crm_status")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: true });

      let crmStatusQuery = supabase
        .from("leads")
        .select("crm_status")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      // Apply campaign filter
      if (campaignSlug) {
        leadsCurrentQuery = leadsCurrentQuery.eq("project_slug", campaignSlug);
        leadsPreviousQuery = leadsPreviousQuery.eq("project_slug", campaignSlug);
        purchasesCurrentQuery = purchasesCurrentQuery.eq("utm_campaign", campaignSlug);
        purchasesPreviousQuery = purchasesPreviousQuery.eq("utm_campaign", campaignSlug);
        leadsDataQuery = leadsDataQuery.eq("project_slug", campaignSlug);
        crmStatusQuery = crmStatusQuery.eq("project_slug", campaignSlug);
      }

      // Apply product filter
      if (productSlug) {
        purchasesCurrentQuery = purchasesCurrentQuery.eq("product_slug", productSlug);
        purchasesPreviousQuery = purchasesPreviousQuery.eq("product_slug", productSlug);
      }

      // ========== CONSOLIDATED PARALLEL QUERIES ==========
      const [
        leadsCurrentResult,
        leadsPreviousResult,
        purchasesCurrentResult,
        purchasesPreviousResult,
        leadsDataResult,
        crmStatusResult,
        recentEventsResult,
        recentLeadsResult,
        recentPurchasesResult,
        fbMetricsCurrentResult,
        fbMetricsPreviousResult
      ] = await Promise.all([
        leadsCurrentQuery,
        leadsPreviousQuery,
        purchasesCurrentQuery,
        purchasesPreviousQuery,
        leadsDataQuery,
        crmStatusQuery,
        // Buscar eventos reais (incluindo tipos em maiúsculas do Hotmart)
        supabase
          .from("lead_events")
          .select(`
            id,
            event_type,
            created_at,
            source,
            event_data,
            lead_id,
            leads (name, email)
          `)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: false })
          .limit(10),
        // Buscar últimos leads cadastrados para atividades recentes (com info de compras)
        supabase
          .from("leads")
          .select(`
            lead_id, name, email, source, utm_source, crm_status, created_at,
            purchases!purchases_lead_id_fkey (id, product_name, value, status)
          `)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: false })
          .limit(5),
        // Buscar TODAS as compras aprovadas recentes para agregar por cliente
        supabase
          .from("purchases")
          .select(`
            id, product_name, value, status, purchase_date, lead_id,
            payment_method, installments, gross_value, is_recurring,
            leads!purchases_lead_id_fkey (name, email, phone, source, utm_source, crm_status)
          `)
          .eq("status", "approved")
          .gte("purchase_date", startDate.toISOString())
          .lte("purchase_date", endDate.toISOString())
          .order("purchase_date", { ascending: false })
          .limit(50),
        // Buscar gastos de tráfego do período atual (fb_metrics)
        supabase
          .from("fb_metrics")
          .select("spend, date_start")
          .gte("date_start", startDate.toISOString().split('T')[0])
          .lte("date_start", endDate.toISOString().split('T')[0]),
        // Buscar gastos de tráfego do período anterior (fb_metrics)
        supabase
          .from("fb_metrics")
          .select("spend")
          .gte("date_start", previousStartDate.toISOString().split('T')[0])
          .lte("date_start", previousEndDate.toISOString().split('T')[0])
      ]);

      // Check for errors in results
      if (leadsCurrentResult.error) throw leadsCurrentResult.error;
      if (leadsPreviousResult.error) throw leadsPreviousResult.error;
      if (purchasesCurrentResult.error) throw purchasesCurrentResult.error;
      if (purchasesPreviousResult.error) throw purchasesPreviousResult.error;
      if (leadsDataResult.error) throw leadsDataResult.error;
      if (crmStatusResult.error) throw crmStatusResult.error;
      if (recentEventsResult.error) throw recentEventsResult.error;
      if (recentLeadsResult.error) throw recentLeadsResult.error;
      if (recentPurchasesResult.error) throw recentPurchasesResult.error;
      if (fbMetricsCurrentResult.error) throw fbMetricsCurrentResult.error;
      if (fbMetricsPreviousResult.error) throw fbMetricsPreviousResult.error;

      // Extract data from results
      const totalLeads = leadsCurrentResult.count || 0;
      const leadsPreviousPeriod = leadsPreviousResult.count || 0;
      const purchases = purchasesCurrentResult.data || [];
      const purchasesPreviousPeriod = purchasesPreviousResult.data || [];
      const leadsData = leadsDataResult.data || [];
      const allLeads = crmStatusResult.data || [];
      const recentEventsRaw = recentEventsResult.data || [];
      const recentLeadsRaw = recentLeadsResult.data || [];
      const recentPurchasesRaw = recentPurchasesResult.data || [];
      const fbMetricsCurrent = fbMetricsCurrentResult.data || [];
      const fbMetricsPrevious = fbMetricsPreviousResult.data || [];

      // ========== COMBINE RECENT ACTIVITIES ==========
      // Transform recent leads into activity format (usar crm_status para diferenciar)
      const leadActivities = recentLeadsRaw.map((lead: any) => {
        const purchases = lead.purchases || [];
        const approvedPurchase = purchases.find((p: any) => p.status === "approved");
        // Considerar cliente se tem crm_status = comprador OU tem compra aprovada
        const isClient = lead.crm_status === "comprador" || !!approvedPurchase;
        
        return {
          id: `lead-${lead.lead_id}`,
          activity_type: isClient ? "cliente" : "lead",
          event_type: isClient ? "new_client" : "new_lead",
          created_at: lead.created_at,
          lead_id: lead.lead_id,
          name: lead.name || lead.email || "Sem nome",
          email: lead.email,
          source: lead.source || lead.utm_source || null,
          product_name: approvedPurchase?.product_name || null,
          value: approvedPurchase?.value || null,
        };
      });

      // Agregar compras por lead_id para mostrar valor total de cada cliente
      const purchasesByLead: Record<string, {
        totalValue: number;
        products: string[];
        latestPurchase: any;
        count: number;
        leadData: any;
      }> = {};

      recentPurchasesRaw.forEach((purchase: any) => {
        const key = purchase.lead_id;
        if (!purchasesByLead[key]) {
          purchasesByLead[key] = {
            totalValue: 0,
            products: [],
            latestPurchase: purchase,
            count: 0,
            leadData: purchase.leads || {},
          };
        }
        purchasesByLead[key].totalValue += purchase.value || 0;
        if (!purchasesByLead[key].products.includes(purchase.product_name)) {
          purchasesByLead[key].products.push(purchase.product_name);
        }
        purchasesByLead[key].count++;
        // Manter a compra mais recente
        if (new Date(purchase.purchase_date) > new Date(purchasesByLead[key].latestPurchase.purchase_date)) {
          purchasesByLead[key].latestPurchase = purchase;
        }
      });

      // Transform aggregated purchases into activity format (sempre cliente)
      const purchaseActivities = Object.entries(purchasesByLead)
        .map(([leadId, data]) => {
          const purchase = data.latestPurchase;
          const leadData = data.leadData;
          
          return {
            id: `purchase-${leadId}`,
            activity_type: "cliente",
            event_type: "new_purchase",
            created_at: purchase.purchase_date,
            lead_id: leadId,
            name: leadData.name || leadData.email || "Sem nome",
            email: leadData.email,
            source: leadData.source || leadData.utm_source || purchase.source || null,
            // Se múltiplos produtos, mostrar contagem
            product_name: data.products.length > 1 
              ? `${data.products.length} produtos`
              : data.products[0],
            products: data.products, // Lista completa para tooltip
            value: data.totalValue, // Valor TOTAL de todas as compras
            purchase_count: data.count,
            payment_method: purchase.payment_method || null,
            installments: purchase.installments || null,
            is_recurring: data.count > 1 || purchase.is_recurring || false,
          };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      // Transform status change events
      const statusActivities = recentEventsRaw
        .filter((e: any) => e.event_type === "status_changed")
        .map((event: any) => ({
          id: event.id,
          activity_type: "status_change",
          event_type: "status_changed",
          created_at: event.created_at,
          lead_id: event.lead_id,
          name: event.leads?.name || event.leads?.email || "Sem nome",
          email: event.leads?.email,
          source: null,
          product_name: null,
          value: null,
          old_status: (event.event_data as any)?.old_status || null,
          new_status: (event.event_data as any)?.new_status || null,
        }));

      // Combine all activities and sort by date (most recent first)
      // Remove duplicates by lead_id for lead/cliente (keep purchase over lead)
      const seenLeadIds = new Set<string>();
      const allActivities = [...purchaseActivities, ...statusActivities, ...leadActivities]
        .filter((activity) => {
          // Always show status changes
          if (activity.activity_type === "status_change") return true;
          
          // For lead/cliente, avoid duplicates
          if (seenLeadIds.has(activity.lead_id)) return false;
          seenLeadIds.add(activity.lead_id);
          return true;
        })
        .sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 10);

      const recentEvents = allActivities;

      // ========== PURCHASES METRICS ==========
      const approvedPurchases = purchases.filter((p) => p.status === "approved");
      const totalRevenue = approvedPurchases.reduce((sum, p) => sum + (p.value || 0), 0);
      const totalConversions = approvedPurchases.length;

      const revenuePreviousPeriod = purchasesPreviousPeriod.reduce((sum, p) => sum + (p.value || 0), 0);
      const salesPreviousPeriod = purchasesPreviousPeriod.length;

      // Conversion rate
      const conversionRate = totalLeads && totalConversions 
        ? ((totalConversions / totalLeads) * 100).toFixed(1)
        : "0.0";

      // ========== AD SPEND METRICS (from fb_metrics) ==========
      const totalAdSpend = fbMetricsCurrent.reduce((sum, m) => sum + (m.spend || 0), 0);
      const adSpendPreviousPeriod = fbMetricsPrevious.reduce((sum, m) => sum + (m.spend || 0), 0);

      // ROAS calculation (using real fb_metrics data)
      const roas = totalAdSpend > 0 ? (totalRevenue / totalAdSpend).toFixed(2) : "0.00";
      
      // Ad spend change percentage
      const adSpendChange = adSpendPreviousPeriod > 0
        ? ((totalAdSpend - adSpendPreviousPeriod) / adSpendPreviousPeriod * 100).toFixed(1)
        : "0";

      // ========== CHART DATA (grouped by day within period) ==========
      const salesByDay: Record<string, { leads: number; sales: number; revenue: number }> = {};

      // Group sales by day
      approvedPurchases.forEach((purchase) => {
        if (!purchase.purchase_date) return;
        const day = format(new Date(purchase.purchase_date), "dd/MM");
        if (!salesByDay[day]) {
          salesByDay[day] = { leads: 0, sales: 0, revenue: 0 };
        }
        salesByDay[day].sales += 1;
        salesByDay[day].revenue += purchase.value || 0;
      });

      // Group leads by day
      leadsData.forEach((lead) => {
        if (!lead.created_at) return;
        const day = format(new Date(lead.created_at), "dd/MM");
        if (!salesByDay[day]) {
          salesByDay[day] = { leads: 0, sales: 0, revenue: 0 };
        }
        salesByDay[day].leads += 1;
      });

      const chartData = Object.entries(salesByDay).map(([date, data]) => ({
        date,
        leads: data.leads,
        sales: data.sales,
        revenue: data.revenue,
      }));

      // ========== REVENUE DATA (daily revenue for chart) ==========
      const revenueByDay: Record<string, number> = {};
      approvedPurchases.forEach((purchase) => {
        if (!purchase.purchase_date) return;
        const day = format(new Date(purchase.purchase_date), "dd/MM");
        revenueByDay[day] = (revenueByDay[day] || 0) + (purchase.value || 0);
      });
      
      const revenueData = Object.entries(revenueByDay).map(([date, revenue]) => ({
        date,
        revenue,
      }));

      // ========== SOURCE DATA (leads and sales grouped by utm_source) ==========
      const sourceMap: Record<string, { leads: number; sales: number }> = {};
      
      // Count leads by source
      leadsData.forEach((lead) => {
        const source = lead.utm_source || "Direto";
        if (!sourceMap[source]) {
          sourceMap[source] = { leads: 0, sales: 0 };
        }
        sourceMap[source].leads += 1;
      });

      // Count sales by source
      approvedPurchases.forEach((purchase) => {
        const source = purchase.utm_source || "Direto";
        if (!sourceMap[source]) {
          sourceMap[source] = { leads: 0, sales: 0 };
        }
        sourceMap[source].sales += 1;
      });

      const sourceData = Object.entries(sourceMap)
        .map(([name, data]) => ({
          name,
          leads: data.leads,
          sales: data.sales,
        }))
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 6);

      // ========== CONVERSION DATA (CRM funnel stages within period) ==========
      const crmStatusCounts: Record<string, number> = {
        lead: 0,
        engajado: 0,
        aquecido: 0,
        carrinho: 0,
        comprador: 0,
        perdido: 0,
      };

      allLeads.forEach((lead) => {
        const status = lead.crm_status || "lead";
        if (crmStatusCounts[status] !== undefined) {
          crmStatusCounts[status]++;
        }
      });

      const conversionData = [
        { stage: "Lead", value: crmStatusCounts.lead, fill: "hsl(var(--chart-1))" },
        { stage: "Engajado", value: crmStatusCounts.engajado, fill: "hsl(var(--chart-2))" },
        { stage: "Aquecido", value: crmStatusCounts.aquecido, fill: "hsl(var(--chart-3))" },
        { stage: "Carrinho", value: crmStatusCounts.carrinho, fill: "hsl(var(--chart-4))" },
        { stage: "Comprador", value: crmStatusCounts.comprador, fill: "hsl(var(--chart-5))" },
      ];

      // ========== TOP PRODUCTS DATA (within period) ==========
      const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
      
      approvedPurchases.forEach((purchase) => {
        const slug = purchase.product_slug || purchase.product_name;
        if (!productSales[slug]) {
          productSales[slug] = {
            name: purchase.product_name,
            sales: 0,
            revenue: 0,
          };
        }
        productSales[slug].sales += 1;
        productSales[slug].revenue += purchase.value || 0;
      });

      const topProductsData = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((product) => ({
          name: product.name,
          sales: product.sales,
          revenue: product.revenue,
        }));

      // ========== CALCULATE CHANGE PERCENTAGES ==========
      const leadsChange = leadsPreviousPeriod > 0
        ? ((totalLeads - leadsPreviousPeriod) / leadsPreviousPeriod * 100).toFixed(1)
        : "0";

      const revenueChange = revenuePreviousPeriod > 0 
        ? ((totalRevenue - revenuePreviousPeriod) / revenuePreviousPeriod * 100).toFixed(1)
        : "0";

      const salesChange = salesPreviousPeriod > 0
        ? ((totalConversions - salesPreviousPeriod) / salesPreviousPeriod * 100).toFixed(1)
        : "0";

      return {
        totalLeads,
        leadsChange: `${leadsChange}%`,
        leadsChangeTrend: Number(leadsChange) >= 0 ? "up" : "down",
        totalSales: totalConversions,
        salesChange: `${salesChange}%`,
        salesChangeTrend: Number(salesChange) >= 0 ? "up" : "down",
        totalRevenue,
        revenueChange: `${revenueChange}%`,
        revenueChangeTrend: Number(revenueChange) >= 0 ? "up" : "down",
        totalAdSpend,
        adSpendChange: `${adSpendChange}%`,
        adSpendChangeTrend: Number(adSpendChange) >= 0 ? "up" : "down",
        conversionRate: `${conversionRate}%`,
        roas: `${roas}x`,
        chartData,
        revenueData,
        sourceData,
        conversionData,
        topProductsData,
        recentEvents,
      };
    },
  });
};
