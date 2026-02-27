import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodFilter, calculateDateRange } from "@/lib/dateUtils";

export interface FacebookMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  cpm: number;
  cpc: number;
  ctr: number;
  frequency: number;
  conversions: number;
  costPerConversion: number;
  roas: number;
}

export interface FacebookAd {
  ad_id: string;
  ad_name: string;
  creative_name: string | null;
  status: string | null;
  metrics: FacebookMetrics;
}

export interface FacebookAdset {
  adset_id: string;
  adset_name: string;
  status: string | null;
  optimization_goal: string | null;
  metrics: FacebookMetrics;
  ads: FacebookAd[];
}

export interface FacebookCampaignHierarchical {
  campaign_id: string;
  campaign_name: string;
  status: string | null;
  objective: string | null;
  metrics: FacebookMetrics;
  adsets: FacebookAdset[];
}

export interface HierarchicalReportData {
  campaigns: FacebookCampaignHierarchical[];
  totals: FacebookMetrics;
  lastUpdated: string;
}

export interface FacebookAdsFilters {
  campaignId?: string;
  adsetId?: string;
  adId?: string;
  status?: string; // "ALL" | "ACTIVE" | "PAUSED"
}

export function useFacebookAdsHierarchicalReports(
  period?: PeriodFilter,
  filters?: FacebookAdsFilters
) {
  return useQuery({
    queryKey: ["facebook-ads-hierarchical-reports", period, filters],
    queryFn: async (): Promise<HierarchicalReportData> => {
      const { startDate, endDate } = period 
        ? calculateDateRange(period) 
        : { startDate: new Date("2020-01-01"), endDate: new Date() };

      // 1. Fetch campaigns with optional status filter
      let campaignsQuery = supabase
        .from("fb_campaigns")
        .select("fb_campaign_id, name, status, objective");

      // Apply status filter
      if (filters?.status && filters.status !== "ALL") {
        campaignsQuery = campaignsQuery.eq("status", filters.status);
      }

      // Apply specific campaign filter
      if (filters?.campaignId) {
        campaignsQuery = campaignsQuery.eq("fb_campaign_id", filters.campaignId);
      }

      const { data: campaigns, error: campaignsError } = await campaignsQuery;

      if (campaignsError) throw campaignsError;
      if (!campaigns || campaigns.length === 0) {
        return {
          campaigns: [],
          totals: createEmptyMetrics(),
          lastUpdated: new Date().toISOString(),
        };
      }

      const campaignIds = campaigns.map((c) => c.fb_campaign_id);

      // 2. Fetch adsets for these campaigns
      let adsetsQuery = supabase
        .from("fb_adsets")
        .select("fb_adset_id, fb_campaign_id, name, status, optimization_goal")
        .in("fb_campaign_id", campaignIds);

      // Apply specific adset filter
      if (filters?.adsetId) {
        adsetsQuery = adsetsQuery.eq("fb_adset_id", filters.adsetId);
      }

      const { data: adsets, error: adsetsError } = await adsetsQuery;

      if (adsetsError) throw adsetsError;

      const adsetIds = adsets?.map((a) => a.fb_adset_id) || [];

      // 3. Fetch ads for these adsets
      let adsQuery = supabase
        .from("fb_ads")
        .select("fb_ad_id, fb_adset_id, name, creative_name, status")
        .in("fb_adset_id", adsetIds);

      // Apply specific ad filter
      if (filters?.adId) {
        adsQuery = adsQuery.eq("fb_ad_id", filters.adId);
      }

      const { data: ads, error: adsError } = await adsQuery;

      if (adsError) throw adsError;

      // 4. Fetch all metrics filtered by period
      const { data: allMetrics, error: metricsError } = await supabase
        .from("fb_metrics")
        .select("*")
        .in("fb_campaign_id", campaignIds)
        .gte("date_start", startDate.toISOString().split("T")[0])
        .lte("date_start", endDate.toISOString().split("T")[0]);

      if (metricsError) throw metricsError;

      // 5. Fetch purchase data for ROAS calculation within period
      const { data: purchases } = await supabase
        .from("purchases")
        .select("value, utm_campaign")
        .eq("status", "approved")
        .gte("purchase_date", startDate.toISOString())
        .lte("purchase_date", endDate.toISOString())
        .in(
          "utm_campaign",
          campaigns.map((c) => c.name)
        );

      // Create lookup maps
      const campaignRevenueMap = new Map<string, number>();
      purchases?.forEach((p) => {
        if (p.utm_campaign) {
          const current = campaignRevenueMap.get(p.utm_campaign) || 0;
          campaignRevenueMap.set(p.utm_campaign, current + Number(p.value || 0));
        }
      });

      // Build hierarchical structure
      const campaignMap = new Map<string, FacebookCampaignHierarchical>();
      campaigns.forEach((campaign) => {
        campaignMap.set(campaign.fb_campaign_id, {
          campaign_id: campaign.fb_campaign_id,
          campaign_name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          metrics: createEmptyMetrics(),
          adsets: [],
        });
      });

      const adsetMap = new Map<string, FacebookAdset>();
      adsets?.forEach((adset) => {
        adsetMap.set(adset.fb_adset_id, {
          adset_id: adset.fb_adset_id,
          adset_name: adset.name,
          status: adset.status,
          optimization_goal: adset.optimization_goal,
          metrics: createEmptyMetrics(),
          ads: [],
        });
      });

      // 6. Split metrics into 3 levels to avoid double counting
      const adLevelMetrics = allMetrics?.filter((m) => m.fb_ad_id) || [];
      const adsetLevelMetrics = allMetrics?.filter((m) => !m.fb_ad_id && m.fb_adset_id) || [];
      const campaignLevelMetrics = allMetrics?.filter((m) => !m.fb_ad_id && !m.fb_adset_id) || [];

      // Add ads to adsets using only ad-level metrics
      ads?.forEach((ad) => {
        const metrics = aggregateMetrics(adLevelMetrics.filter((m) => m.fb_ad_id === ad.fb_ad_id));
        const adsetData = adsetMap.get(ad.fb_adset_id);
        if (adsetData) {
          adsetData.ads.push({
            ad_id: ad.fb_ad_id,
            ad_name: ad.name,
            creative_name: ad.creative_name,
            status: ad.status,
            metrics,
          });
          adsetData.metrics = sumMetrics(adsetData.metrics, metrics);
        }
      });

      // Add direct adset-level metrics
      adsets?.forEach((adset) => {
        const directMetrics = aggregateMetrics(adsetLevelMetrics.filter((m) => m.fb_adset_id === adset.fb_adset_id));
        const adsetData = adsetMap.get(adset.fb_adset_id);
        if (adsetData) {
          adsetData.metrics = sumMetrics(adsetData.metrics, directMetrics);
        }
      });

      // Add adsets to campaigns and aggregate upward
      adsets?.forEach((adset) => {
        const campaignData = campaignMap.get(adset.fb_campaign_id);
        const adsetData = adsetMap.get(adset.fb_adset_id);
        if (campaignData && adsetData) {
          campaignData.adsets.push(adsetData);
          campaignData.metrics = sumMetrics(campaignData.metrics, adsetData.metrics);
        }
      });

      // Add direct campaign-level metrics
      campaigns.forEach((campaign) => {
        const directMetrics = aggregateMetrics(campaignLevelMetrics.filter((m) => m.fb_campaign_id === campaign.fb_campaign_id));
        const campaignData = campaignMap.get(campaign.fb_campaign_id);
        if (campaignData) {
          campaignData.metrics = sumMetrics(campaignData.metrics, directMetrics);
        }
      });

      // Calculate ROAS for each campaign
      campaignMap.forEach((campaign) => {
        const revenue = campaignRevenueMap.get(campaign.campaign_name) || 0;
        campaign.metrics.roas = campaign.metrics.spend > 0 ? revenue / campaign.metrics.spend : 0;
      });

      const campaignsArray = Array.from(campaignMap.values());

      // Calculate totals
      const totals = campaignsArray.reduce(
        (acc, campaign) => ({
          impressions: acc.impressions + campaign.metrics.impressions,
          reach: acc.reach + campaign.metrics.reach,
          clicks: acc.clicks + campaign.metrics.clicks,
          spend: acc.spend + campaign.metrics.spend,
          cpm: 0,
          cpc: 0,
          ctr: 0,
          frequency: 0,
          conversions: acc.conversions + campaign.metrics.conversions,
          costPerConversion: 0,
          roas: 0,
        }),
        createEmptyMetrics()
      );

      // Calculate derived metrics for totals
      totals.cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
      totals.cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
      totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      totals.frequency = totals.reach > 0 ? totals.impressions / totals.reach : 0;
      totals.costPerConversion =
        totals.conversions > 0 ? totals.spend / totals.conversions : 0;

      const totalRevenue = Array.from(campaignRevenueMap.values()).reduce((a, b) => a + b, 0);
      totals.roas = totals.spend > 0 ? totalRevenue / totals.spend : 0;

      return {
        campaigns: campaignsArray,
        totals,
        lastUpdated: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
  });
}

function createEmptyMetrics(): FacebookMetrics {
  return {
    impressions: 0,
    reach: 0,
    clicks: 0,
    spend: 0,
    cpm: 0,
    cpc: 0,
    ctr: 0,
    frequency: 0,
    conversions: 0,
    costPerConversion: 0,
    roas: 0,
  };
}

function aggregateMetrics(metrics: any[]): FacebookMetrics {
  if (metrics.length === 0) return createEmptyMetrics();

  const aggregated = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + (m.impressions || 0),
      reach: acc.reach + (m.reach || 0),
      clicks: acc.clicks + (m.clicks || 0),
      spend: acc.spend + Number(m.spend || 0),
      conversions: acc.conversions + (m.conversions || 0),
      frequency: acc.frequency + Number(m.frequency || 0),
    }),
    {
      impressions: 0,
      reach: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      frequency: 0,
    }
  );

  // Calculate derived metrics
  const cpm = aggregated.impressions > 0 ? (aggregated.spend / aggregated.impressions) * 1000 : 0;
  const cpc = aggregated.clicks > 0 ? aggregated.spend / aggregated.clicks : 0;
  const ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0;
  const avgFrequency = aggregated.reach > 0 ? aggregated.impressions / aggregated.reach : 0;
  const costPerConversion =
    aggregated.conversions > 0 ? aggregated.spend / aggregated.conversions : 0;

  return {
    ...aggregated,
    cpm,
    cpc,
    ctr,
    frequency: avgFrequency,
    costPerConversion,
    roas: 0, // Will be calculated separately with revenue data
  };
}

function sumMetrics(a: FacebookMetrics, b: FacebookMetrics): FacebookMetrics {
  const summed = {
    impressions: a.impressions + b.impressions,
    reach: a.reach + b.reach,
    clicks: a.clicks + b.clicks,
    spend: a.spend + b.spend,
    conversions: a.conversions + b.conversions,
    cpm: 0,
    cpc: 0,
    ctr: 0,
    frequency: 0,
    costPerConversion: 0,
    roas: 0,
  };

  // Recalculate derived metrics
  summed.cpm = summed.impressions > 0 ? (summed.spend / summed.impressions) * 1000 : 0;
  summed.cpc = summed.clicks > 0 ? summed.spend / summed.clicks : 0;
  summed.ctr = summed.impressions > 0 ? (summed.clicks / summed.impressions) * 100 : 0;
  summed.frequency = summed.reach > 0 ? summed.impressions / summed.reach : 0;
  summed.costPerConversion = summed.conversions > 0 ? summed.spend / summed.conversions : 0;

  return summed;
}
