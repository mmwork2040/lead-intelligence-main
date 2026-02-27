import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FacebookAdsMetrics {
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
  revenue: number;
  roas: number;
}

export interface FacebookCampaignReport {
  campaign_id: string;
  campaign_name: string;
  status: string;
  objective: string | null;
  metrics: FacebookAdsMetrics;
}

export function useFacebookAdsReports() {
  return useQuery({
    queryKey: ["facebook-ads-reports-active"],
    queryFn: async () => {
      // First, fetch ACTIVE campaigns
      const { data: activeCampaigns, error: campaignsError } = await supabase
        .from("fb_campaigns")
        .select("fb_campaign_id, name, status, objective")
        .eq("status", "ACTIVE");

      if (campaignsError) throw campaignsError;
      
      if (!activeCampaigns || activeCampaigns.length === 0) {
        return {
          campaigns: [],
          totals: {
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
            revenue: 0,
            roas: 0,
          },
          lastUpdated: new Date().toISOString(),
        };
      }

      // Create campaign lookup map
      const campaignMap = new Map(
        activeCampaigns.map(c => [c.fb_campaign_id, c])
      );
      const activeCampaignIds = activeCampaigns.map(c => c.fb_campaign_id);

      // Fetch metrics only for active campaigns
      const { data: metricsData, error: metricsError } = await supabase
        .from("fb_metrics")
        .select("*")
        .in("fb_campaign_id", activeCampaignIds);

      if (metricsError) throw metricsError;

      // Aggregate metrics by campaign
      const campaignMetrics = new Map<string, {
        campaign_name: string;
        status: string;
        objective: string | null;
        impressions: number;
        reach: number;
        clicks: number;
        spend: number;
        conversions: number;
        frequency_sum: number;
        frequency_count: number;
      }>();

      metricsData?.forEach((metric: any) => {
        const campaignId = metric.fb_campaign_id;
        const campaign = campaignMap.get(campaignId);
        
        if (!campaign) return;

        if (!campaignMetrics.has(campaignId)) {
          campaignMetrics.set(campaignId, {
            campaign_name: campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            impressions: 0,
            reach: 0,
            clicks: 0,
            spend: 0,
            conversions: 0,
            frequency_sum: 0,
            frequency_count: 0,
          });
        }

        const agg = campaignMetrics.get(campaignId)!;
        agg.impressions += metric.impressions || 0;
        agg.reach += metric.reach || 0;
        agg.clicks += metric.clicks || 0;
        agg.spend += typeof metric.spend === 'number' ? metric.spend : parseFloat(String(metric.spend || 0));
        agg.conversions += metric.conversions || 0;
        if (metric.frequency) {
          agg.frequency_sum += metric.frequency;
          agg.frequency_count += 1;
        }
      });

      // Get revenue from purchases (all time for ROAS calculation)
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select("utm_campaign, value, status")
        .eq("status", "approved");

      const revenueByUtmCampaign = new Map<string, number>();
      purchasesData?.forEach((purchase) => {
        const utmCampaign = purchase.utm_campaign || "";
        const current = revenueByUtmCampaign.get(utmCampaign) || 0;
        const value = typeof purchase.value === 'number' ? purchase.value : parseFloat(String(purchase.value || 0));
        revenueByUtmCampaign.set(utmCampaign, current + value);
      });

      // Build final report
      const reports: FacebookCampaignReport[] = Array.from(campaignMetrics.entries()).map(
        ([campaignId, agg]) => {
          const cpm = agg.impressions > 0 ? (agg.spend / agg.impressions) * 1000 : 0;
          const cpc = agg.clicks > 0 ? agg.spend / agg.clicks : 0;
          const ctr = agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0;
          const frequency = agg.frequency_count > 0 ? agg.frequency_sum / agg.frequency_count : 0;
          const costPerConversion = agg.conversions > 0 ? agg.spend / agg.conversions : 0;

          // Try to match revenue by campaign name
          const revenue = revenueByUtmCampaign.get(agg.campaign_name) || 0;
          const roas = agg.spend > 0 ? revenue / agg.spend : 0;

          return {
            campaign_id: campaignId,
            campaign_name: agg.campaign_name,
            status: agg.status,
            objective: agg.objective,
            metrics: {
              impressions: agg.impressions,
              reach: agg.reach,
              clicks: agg.clicks,
              spend: agg.spend,
              cpm,
              cpc,
              ctr,
              frequency,
              conversions: agg.conversions,
              costPerConversion,
              revenue,
              roas,
            },
          };
        }
      );

      // Calculate totals
      const totals: FacebookAdsMetrics = reports.reduce(
        (acc, report) => ({
          impressions: acc.impressions + report.metrics.impressions,
          reach: acc.reach + report.metrics.reach,
          clicks: acc.clicks + report.metrics.clicks,
          spend: acc.spend + report.metrics.spend,
          cpm: 0, // Will calculate after
          cpc: 0, // Will calculate after
          ctr: 0, // Will calculate after
          frequency: 0, // Will calculate after
          conversions: acc.conversions + report.metrics.conversions,
          costPerConversion: 0, // Will calculate after
          revenue: acc.revenue + report.metrics.revenue,
          roas: 0, // Will calculate after
        }),
        {
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
          revenue: 0,
          roas: 0,
        }
      );

      totals.cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
      totals.cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
      totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      totals.costPerConversion = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
      totals.roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

      return {
        campaigns: reports,
        totals,
        lastUpdated: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
