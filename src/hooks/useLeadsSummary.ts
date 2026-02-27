import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, startOfDay } from "date-fns";
import { calculateDateRange, type PeriodFilter } from "@/lib/dateUtils";

interface LeadsSummaryFilters {
  period?: PeriodFilter;
  productSlug?: string;
  source?: string;
  state?: string;
  city?: string;
  tagIds?: string[];
  crmStatus?: string;
  utmSource?: string;
  utmCampaign?: string;
  projectSlug?: string;
  hasPurchase?: boolean;
  noPurchase?: boolean;
}

export const useLeadsSummary = (filters?: LeadsSummaryFilters) => {
  return useQuery({
    queryKey: ["leads-summary", filters],
    queryFn: async () => {
      const now = new Date();
      const startOfThisMonth = startOfMonth(now).toISOString();
      const startOfToday = startOfDay(now).toISOString();

      // Calculate date range from period filter
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      if (filters?.period && filters.period.type !== "all") {
        const range = calculateDateRange(filters.period);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      // If filtering by product, we need to get lead_ids from purchases first
      let productLeadIds: string[] | null = null;
      if (filters?.productSlug) {
        const { data: productPurchases } = await supabase
          .from("purchases")
          .select("lead_id")
          .eq("product_slug", filters.productSlug);
        productLeadIds = [...new Set(productPurchases?.map(p => p.lead_id) || [])];
        
        // If no leads found for this product, return zeros
        if (productLeadIds.length === 0) {
          return {
            totalLeads: 0,
            leadsThisMonth: 0,
            leadsToday: 0,
            buyers: 0,
            qualifiedLeads: 0,
            conversionRate: 0,
          };
        }
      }

      // If filtering by tags, get lead_ids from lead_tags
      let tagLeadIds: string[] | null = null;
      if (filters?.tagIds && filters.tagIds.length > 0) {
        const { data: taggedLeads } = await supabase
          .from("lead_tags")
          .select("lead_id")
          .in("tag_id", filters.tagIds);
        tagLeadIds = [...new Set(taggedLeads?.map(t => t.lead_id) || [])];
        
        if (tagLeadIds.length === 0) {
          return {
            totalLeads: 0,
            leadsThisMonth: 0,
            leadsToday: 0,
            buyers: 0,
            qualifiedLeads: 0,
            conversionRate: 0,
          };
        }
      }

      // Build base query for total leads
      let totalQuery = supabase.from("leads").select("*", { count: "exact", head: true });
      
      // Apply date filters
      if (startDate) {
        totalQuery = totalQuery.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        totalQuery = totalQuery.lte("created_at", endDate.toISOString());
      }
      
      // Apply source filter
      if (filters?.source) {
        totalQuery = totalQuery.eq("source", filters.source);
      }
      
      // Apply state/city filters
      if (filters?.state) {
        totalQuery = totalQuery.eq("state", filters.state);
      }
      if (filters?.city) {
        totalQuery = totalQuery.eq("city", filters.city);
      }
      
      // Apply CRM status filter
      if (filters?.crmStatus) {
        totalQuery = totalQuery.eq("crm_status", filters.crmStatus);
      }
      
      // Apply UTM filters
      if (filters?.utmSource) {
        totalQuery = totalQuery.eq("utm_source", filters.utmSource);
      }
      if (filters?.utmCampaign) {
        totalQuery = totalQuery.eq("utm_campaign", filters.utmCampaign);
      }
      
      // Apply project slug filter
      if (filters?.projectSlug) {
        totalQuery = totalQuery.eq("project_slug", filters.projectSlug);
      }
      
      // Apply product filter (via lead_ids)
      if (productLeadIds) {
        totalQuery = totalQuery.in("lead_id", productLeadIds);
      }
      
      // Apply tag filter (via lead_ids)
      if (tagLeadIds) {
        totalQuery = totalQuery.in("lead_id", tagLeadIds);
      }

      const { count: totalLeads } = await totalQuery;

      // Get all filtered lead_ids for buyers calculation
      let filteredLeadIds: string[] | null = null;
      if (filters?.period?.type !== "all" || filters?.source || filters?.state || filters?.city || filters?.crmStatus || filters?.utmSource || filters?.utmCampaign || filters?.projectSlug || productLeadIds || tagLeadIds) {
        let leadsQuery = supabase.from("leads").select("lead_id");
        
        if (startDate) {
          leadsQuery = leadsQuery.gte("created_at", startDate.toISOString());
        }
        if (endDate) {
          leadsQuery = leadsQuery.lte("created_at", endDate.toISOString());
        }
        if (filters?.source) {
          leadsQuery = leadsQuery.eq("source", filters.source);
        }
        if (filters?.state) {
          leadsQuery = leadsQuery.eq("state", filters.state);
        }
        if (filters?.city) {
          leadsQuery = leadsQuery.eq("city", filters.city);
        }
        if (filters?.crmStatus) {
          leadsQuery = leadsQuery.eq("crm_status", filters.crmStatus);
        }
        if (filters?.utmSource) {
          leadsQuery = leadsQuery.eq("utm_source", filters.utmSource);
        }
        if (filters?.utmCampaign) {
          leadsQuery = leadsQuery.eq("utm_campaign", filters.utmCampaign);
        }
        if (filters?.projectSlug) {
          leadsQuery = leadsQuery.eq("project_slug", filters.projectSlug);
        }
        if (productLeadIds) {
          leadsQuery = leadsQuery.in("lead_id", productLeadIds);
        }
        if (tagLeadIds) {
          leadsQuery = leadsQuery.in("lead_id", tagLeadIds);
        }
        
        const { data: leadsData } = await leadsQuery;
        filteredLeadIds = leadsData?.map(l => l.lead_id) || [];
      }

      // Leads this month (within filtered date range if applicable)
      let leadsThisMonth = 0;
      if (!startDate || new Date(startOfThisMonth) >= startDate) {
        let monthQuery = supabase.from("leads").select("*", { count: "exact", head: true });
        monthQuery = monthQuery.gte("created_at", startOfThisMonth);
        if (endDate) {
          monthQuery = monthQuery.lte("created_at", endDate.toISOString());
        }
        if (filters?.source) monthQuery = monthQuery.eq("source", filters.source);
        if (filters?.state) monthQuery = monthQuery.eq("state", filters.state);
        if (filters?.city) monthQuery = monthQuery.eq("city", filters.city);
        if (filters?.crmStatus) monthQuery = monthQuery.eq("crm_status", filters.crmStatus);
        if (filters?.utmSource) monthQuery = monthQuery.eq("utm_source", filters.utmSource);
        if (filters?.utmCampaign) monthQuery = monthQuery.eq("utm_campaign", filters.utmCampaign);
        if (filters?.projectSlug) monthQuery = monthQuery.eq("project_slug", filters.projectSlug);
        if (productLeadIds) monthQuery = monthQuery.in("lead_id", productLeadIds);
        if (tagLeadIds) monthQuery = monthQuery.in("lead_id", tagLeadIds);
        
        const { count } = await monthQuery;
        leadsThisMonth = count || 0;
      }

      // Leads today (within filtered date range if applicable)
      let leadsToday = 0;
      if (!startDate || new Date(startOfToday) >= startDate) {
        let todayQuery = supabase.from("leads").select("*", { count: "exact", head: true });
        todayQuery = todayQuery.gte("created_at", startOfToday);
        if (endDate) {
          todayQuery = todayQuery.lte("created_at", endDate.toISOString());
        }
        if (filters?.source) todayQuery = todayQuery.eq("source", filters.source);
        if (filters?.state) todayQuery = todayQuery.eq("state", filters.state);
        if (filters?.city) todayQuery = todayQuery.eq("city", filters.city);
        if (filters?.crmStatus) todayQuery = todayQuery.eq("crm_status", filters.crmStatus);
        if (filters?.utmSource) todayQuery = todayQuery.eq("utm_source", filters.utmSource);
        if (filters?.utmCampaign) todayQuery = todayQuery.eq("utm_campaign", filters.utmCampaign);
        if (filters?.projectSlug) todayQuery = todayQuery.eq("project_slug", filters.projectSlug);
        if (productLeadIds) todayQuery = todayQuery.in("lead_id", productLeadIds);
        if (tagLeadIds) todayQuery = todayQuery.in("lead_id", tagLeadIds);
        
        const { count } = await todayQuery;
        leadsToday = count || 0;
      }

      // Buyers calculation with filters
      let buyersQuery = supabase.from("purchases").select("lead_id").eq("status", "approved");
      
      if (filters?.productSlug) {
        buyersQuery = buyersQuery.eq("product_slug", filters.productSlug);
      }
      
      const { data: buyerLeads } = await buyersQuery;
      let buyerLeadIds = [...new Set(buyerLeads?.map(p => p.lead_id) || [])];
      
      // Filter buyers by the filtered lead set
      if (filteredLeadIds) {
        buyerLeadIds = buyerLeadIds.filter(id => filteredLeadIds.includes(id));
      }
      
      const uniqueBuyers = buyerLeadIds.length;

      const conversionRate = totalLeads && totalLeads > 0 
        ? Math.round((uniqueBuyers / totalLeads) * 100) 
        : 0;

      return {
        totalLeads: totalLeads || 0,
        leadsThisMonth,
        leadsToday,
        buyers: uniqueBuyers,
        qualifiedLeads: 0,
        conversionRate,
      };
    },
  });
};
