import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentUserId } from "@/lib/getCurrentUserId";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { PeriodFilter, calculateDateRange } from "@/lib/dateUtils";
import { useIsDemo } from "@/contexts/DemoContext";
import { demoLeads } from "@/services/demoData";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export type LeadProduct = {
  name: string;
  slug: string | null;
};

export type LeadTag = {
  id: string;
  name: string;
  color: string | null;
};

type LeadTagJoinRow = {
  lead_id: string;
  tags: LeadTag | null;
};

type LeadTagSingleRow = {
  tag_id: string;
  tags: LeadTag | null;
};

export type LeadWithProducts = Lead & {
  products: LeadProduct[];
  tags: LeadTag[];
  totalValue?: number;
  totalPurchases?: number;
};

export interface LeadsFilters {
  search?: string;
  source?: string;
  productSlug?: string;
  period: PeriodFilter;
  tagIds?: string[];
  // Filtros avançados
  crmStatus?: string;
  state?: string;
  city?: string;
  utmSource?: string;
  utmCampaign?: string;
  projectSlug?: string;
  hasPurchase?: boolean;
  noPurchase?: boolean;
}

export type SortField = "created_at" | "name" | "totalValue" | "totalPurchases";
export type SortDirection = "asc" | "desc";

export const useLeads = (filters?: LeadsFilters, pagination?: { page: number; pageSize: number }) => {
  const { user } = useAuth();
  const isDemo = useIsDemo();
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 50;

  return useQuery({
    queryKey: ["leads", filters, pagination, user?.id, isDemo],
    queryFn: async () => {
      if (isDemo) return demoLeads as unknown as { data: LeadWithProducts[]; total: number; page: number; pageSize: number; totalPages: number };

      // ========== STEP 1: Get lead IDs that match product and tag filters ==========
      let productFilteredLeadIds: Set<string> | null = null;
      let tagFilteredLeadIds: Set<string> | null = null;

      // Parallel filter queries
      const [productFilterResult, tagFilterResult] = await Promise.all([
        filters?.productSlug
          ? supabase
            .from("purchases")
            .select("lead_id")
            .eq("product_slug", filters.productSlug)
          : Promise.resolve({ data: null }),
        filters?.tagIds && filters.tagIds.length > 0
          ? supabase
            .from("lead_tags")
            .select("lead_id")
            .in("tag_id", filters.tagIds)
          : Promise.resolve({ data: null }),
      ]);

      if (productFilterResult.data) {
        productFilteredLeadIds = new Set(productFilterResult.data.map(p => p.lead_id));
      }
      if (tagFilterResult.data) {
        tagFilteredLeadIds = new Set(tagFilterResult.data.map(t => t.lead_id));
      }

      // ========== STEP 2: Build main query with filters ==========
      let query = supabase
        .from("leads")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Search filter (sanitized to prevent PostgREST filter injection)
      if (filters?.search) {
        const sanitized = filters.search.replace(/[,.()"\\%*]/g, '');
        if (sanitized.trim()) {
          query = query.or(
            `name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`
          );
        }
      }

      // Source filter
      if (filters?.source) {
        query = query.eq("source", filters.source);
      }

      // Date filter
      if (filters?.period && filters.period.type !== "all") {
        const { startDate, endDate } = calculateDateRange(filters.period);
        query = query
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());
      }

      // ========== ADVANCED FILTERS ==========
      // CRM Status filter
      if (filters?.crmStatus) {
        query = query.eq("crm_status", filters.crmStatus);
      }

      // State filter
      if (filters?.state) {
        query = query.eq("state", filters.state);
      }

      // City filter (like search)
      if (filters?.city) {
        query = query.ilike("city", `%${filters.city}%`);
      }

      // UTM Source filter
      if (filters?.utmSource) {
        query = query.ilike("utm_source", `%${filters.utmSource}%`);
      }

      // UTM Campaign filter
      if (filters?.utmCampaign) {
        query = query.ilike("utm_campaign", `%${filters.utmCampaign}%`);
      }

      // Project/Campaign filter
      if (filters?.projectSlug) {
        query = query.eq("project_slug", filters.projectSlug);
      }

      // Has/No Purchase filter - get lead IDs with purchases
      if (filters?.hasPurchase || filters?.noPurchase) {
        const { data: leadsWithPurchases } = await supabase
          .from("purchases")
          .select("lead_id")
          .eq("status", "approved");

        const purchaseLeadIds = new Set(leadsWithPurchases?.map(p => p.lead_id) || []);

        if (filters?.hasPurchase && purchaseLeadIds.size > 0) {
          query = query.in("lead_id", Array.from(purchaseLeadIds));
        } else if (filters?.noPurchase) {
          // Get all lead IDs and filter out those with purchases
          const { data: allLeads } = await supabase.from("leads").select("lead_id");
          const noActivityIds = allLeads?.filter(l => !purchaseLeadIds.has(l.lead_id)).map(l => l.lead_id) || [];
          if (noActivityIds.length === 0) {
            return { data: [], total: 0, page, pageSize, totalPages: 0 };
          }
          query = query.in("lead_id", noActivityIds);
        }
      }

      // Product filter - use IN clause if we have filtered lead IDs
      if (productFilteredLeadIds) {
        const leadIdArray = Array.from(productFilteredLeadIds);
        if (leadIdArray.length === 0) {
          return { data: [], total: 0, page, pageSize, totalPages: 0 };
        }
        query = query.in("lead_id", leadIdArray);
      }

      // Tag filter - use IN clause if we have filtered lead IDs
      if (tagFilteredLeadIds) {
        const leadIdArray = Array.from(tagFilteredLeadIds);
        if (leadIdArray.length === 0) {
          return { data: [], total: 0, page, pageSize, totalPages: 0 };
        }
        query = query.in("lead_id", leadIdArray);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const results = data as Lead[];
      const total = count || 0;

      // ========== STEP 3: Batch fetch products and tags for all leads in one query ==========
      if (results.length > 0) {
        const leadIds = results.map(lead => lead.lead_id);

        // Fetch products and tags in parallel
        const [purchasesResult, tagsResult] = await Promise.all([
          supabase
            .from("purchases")
            .select("lead_id, product_name, product_slug, value")
            .in("lead_id", leadIds)
            .eq("status", "approved"),
          supabase
            .from("lead_tags")
            .select("lead_id, tags(id, name, color)")
            .in("lead_id", leadIds)
        ]);

        const purchases = purchasesResult.data;
        const leadTagsData = tagsResult.data;

        // Group products by lead_id and calculate totals
        const productsByLead: Record<string, LeadProduct[]> = {};
        const seenProducts: Record<string, Set<string>> = {};
        const valueByLead: Record<string, number> = {};
        const countByLead: Record<string, number> = {};

        purchases?.forEach(p => {
          if (!productsByLead[p.lead_id]) {
            productsByLead[p.lead_id] = [];
            seenProducts[p.lead_id] = new Set();
            valueByLead[p.lead_id] = 0;
            countByLead[p.lead_id] = 0;
          }
          // Sum values and count
          valueByLead[p.lead_id] += p.value || 0;
          countByLead[p.lead_id] += 1;

          // Avoid duplicates using Set for product names
          if (!seenProducts[p.lead_id].has(p.product_name)) {
            seenProducts[p.lead_id].add(p.product_name);
            productsByLead[p.lead_id].push({
              name: p.product_name,
              slug: p.product_slug
            });
          }
        });

        // Group tags by lead_id
        const tagsByLead: Record<string, LeadTag[]> = {};
        (leadTagsData as LeadTagJoinRow[] | null)?.forEach((lt) => {
          if (!tagsByLead[lt.lead_id]) {
            tagsByLead[lt.lead_id] = [];
          }
          if (lt.tags) {
            tagsByLead[lt.lead_id].push({
              id: lt.tags.id,
              name: lt.tags.name,
              color: lt.tags.color
            });
          }
        });

        // Return leads with products, tags, and totals
        return {
          data: results.map(lead => ({
            ...lead,
            products: productsByLead[lead.lead_id] || [],
            tags: tagsByLead[lead.lead_id] || [],
            totalValue: valueByLead[lead.lead_id] || 0,
            totalPurchases: countByLead[lead.lead_id] || 0,
          })) as LeadWithProducts[],
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      }

      return {
        data: results.map(lead => ({
          ...lead,
          products: [],
          tags: [],
          totalValue: 0,
          totalPurchases: 0,
        })) as LeadWithProducts[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    },
    enabled: true,
  });
};

export const useLead = (leadId: string) => {
  return useQuery({
    queryKey: ["leads", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("lead_id", leadId)
        .single();

      if (error) throw error;

      // Fetch lead tags
      const { data: tagsData } = await supabase
        .from("lead_tags")
        .select("tag_id, tags(id, name, color)")
        .eq("lead_id", leadId);

      const tags = (tagsData as LeadTagSingleRow[] | null)?.map((lt) => lt.tags).filter(Boolean) || [];

      return { ...data, tags } as Lead & { tags: LeadTag[] };
    },
    enabled: !!leadId,
  });
};

export interface CreateLeadInput extends LeadInsert {
  tags?: string[];
  newTags?: string[];
}

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const { tags, newTags, ...lead } = input;
      const user_id = await getCurrentUserId();

      const { data, error } = await supabase.from("leads").insert({ ...lead, user_id }).select().single();

      if (error) throw error;

      // Create a lead_created event
      await supabase.from("lead_events").insert({
        lead_id: data.lead_id,
        event_type: "lead_created",
        source: lead.source || "manual",
        event_data: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
        },
        user_id,
      });

      // Create new tags if any
      const createdTagIds: string[] = [];
      if (newTags && newTags.length > 0) {
        for (const tagName of newTags) {
          const { data: tagData, error: tagError } = await supabase
            .from("tags")
            .insert({ name: tagName, source: "manual", user_id })
            .select()
            .single();

          if (!tagError && tagData) {
            createdTagIds.push(tagData.id);
          }
        }
      }

      // Associate existing tags and newly created tags
      const allTagIds = [...(tags || []), ...createdTagIds];
      if (allTagIds.length > 0) {
        const tagAssociations = allTagIds.map((tagId) => ({
          lead_id: data.lead_id,
          tag_id: tagId,
          source: "manual",
          user_id,
        }));

        await supabase.from("lead_tags").insert(tagAssociations);
      }

      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Lead criado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating lead:", error);
      toast.error(error.message || "Erro ao criar lead");
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: string; updates: LeadUpdate }) => {
      // First, get the current lead data to save as a version
      const { data: currentLead } = await supabase
        .from("leads")
        .select("*")
        .eq("lead_id", leadId)
        .single();

      // Save current state as a version before updating
      if (currentLead) {
        try {
          // Get the current max version number
          const { data: existingVersions } = await supabase
            .from("lead_versions")
            .select("version_number")
            .eq("lead_id", leadId)
            .order("version_number", { ascending: false })
            .limit(1);

          const nextVersion = existingVersions && existingVersions.length > 0
            ? (existingVersions[0].version_number || 0) + 1
            : 1;

          const { data: session } = await supabase.auth.getSession();

          // Determine what changed for the summary
          const currentLeadRecord = currentLead as Record<string, unknown>;
          const updatesRecord = updates as Record<string, unknown>;
          const changedFields = Object.keys(updates).filter(
            (key) => currentLeadRecord[key] !== updatesRecord[key]
          );
          const changeSummary = changedFields.length > 0
            ? `Alterou: ${changedFields.join(", ")}`
            : "Atualização de dados";

          await supabase
            .from("lead_versions")
            .insert({
              lead_id: leadId,
              version_number: nextVersion,
              data: currentLead as any,
              changed_by: session?.session?.user?.id || null,
              change_summary: changeSummary,
            });
        } catch (versionError) {
          console.warn("Could not save lead version:", versionError);
          // Continue with update even if version saving fails
        }
      }

      // Now perform the update
      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("lead_id", leadId)
        .select()
        .single();

      if (error) throw error;

      // Create a lead_updated event
      await supabase.from("lead_events").insert({
        lead_id: leadId,
        event_type: "lead_updated",
        source: "manual",
        event_data: updates,
      });

      return data as Lead;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-versions", variables.leadId] });
      toast.success("Lead atualizado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error updating lead:", error);
      toast.error(error.message || "Erro ao atualizar lead");
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      // Delete related data first to avoid FK constraint errors
      // Using allSettled so partial failures don't abort the entire deletion
      const results = await Promise.allSettled([
        supabase.from("lead_events").delete().eq("lead_id", leadId),
        supabase.from("lead_tags").delete().eq("lead_id", leadId),
        supabase.from("survey_responses").delete().eq("lead_id", leadId),
        supabase.from("invoice_requests").delete().eq("lead_id", leadId),
        supabase.from("purchases").delete().eq("lead_id", leadId),
        supabase.from("lead_merge_logs").delete().eq("master_lead_id", leadId),
        supabase.from("lead_versions").delete().eq("lead_id", leadId),
      ]);

      // Log any partial failures for debugging
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.warn(`Lead deletion: cleanup step ${index} failed:`, result.reason);
        }
      });

      // Now delete the lead
      const { error } = await supabase.from("leads").delete().eq("lead_id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["lead-events"] });
      toast.success("Lead excluído com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error deleting lead:", error);
      toast.error(error.message || "Erro ao excluir lead");
    },
  });
};
