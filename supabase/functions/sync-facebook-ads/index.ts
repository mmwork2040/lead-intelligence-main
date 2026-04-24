import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get('ALLOWED_ORIGIN') || '*',
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function ok(payload: unknown) {
  return new Response(JSON.stringify(payload), { status: 200, headers: jsonHeaders });
}

type FacebookApiError = {
  message?: string;
  code?: number;
  error_subcode?: number;
  type?: string;
  fbtrace_id?: string;
};

function parseFacebookError(fbError: FacebookApiError) {
  const message = fbError?.message ?? "Facebook API error";
  const code = fbError?.code;
  const msg = String(message).toLowerCase();
  const isExpired =
    code === 190 || msg.includes("expired") || msg.includes("session has expired");

  return { message, code, isExpired };
}

// Parallel batch processor
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

// Retry wrapper for API calls
async function fetchWithRetry(url: string, retries: number = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok || i === retries) return response;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("Fetch failed after retries");
}

interface SyncOptions {
  syncMode: "quick" | "full";
  daysBack: number;
  skipAds: boolean;
  activeOnly: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), { status: 401, headers: jsonHeaders });
    }

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
    }

    // Parse request body for sync options
    let options: SyncOptions = {
      syncMode: "quick",
      daysBack: 14,
      skipAds: false,
      activeOnly: true,
    };

    try {
      const body = await req.json();
      if (body.syncMode) options.syncMode = body.syncMode;
      if (body.daysBack) options.daysBack = Math.min(body.daysBack, 365);
      if (body.skipAds !== undefined) options.skipAds = body.skipAds;
      if (body.activeOnly !== undefined) options.activeOnly = body.activeOnly;
    } catch {
      // Use defaults if no body
    }

    // Adjust settings based on sync mode
    if (options.syncMode === "full") {
      options.daysBack = 90;
      options.skipAds = false;
      options.activeOnly = false;
    }

    console.info(`Starting Facebook Ads sync (mode: ${options.syncMode}, days: ${options.daysBack})...`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get active config
    const { data: config, error: configError } = await supabase
      .from("fb_ads_config")
      .select("*")
      .eq("is_active", true)
      .single();

    if (configError || !config) {
      return ok({
        success: false,
        error: "No active Facebook Ads configuration found",
        code: "NO_ACTIVE_CONFIG",
      });
    }

    const access_token = config.access_token;
    const ad_account_id = config.ad_account_id.startsWith("act_")
      ? config.ad_account_id
      : `act_${config.ad_account_id}`;

    const baseUrl = "https://graph.facebook.com/v25.0";

    // Validate token before proceeding
    console.info("Validating Facebook token...");
    const tokenTestResponse = await fetchWithRetry(
      `${baseUrl}/me?access_token=${access_token}`
    );
    const tokenTestData = await tokenTestResponse.json();

    if (tokenTestData.error) {
      const fbError = tokenTestData.error as FacebookApiError;
      const { message, code, isExpired } = parseFacebookError(fbError);

      console.error("Token validation failed:", fbError);

      return ok({
        success: false,
        error: message || "Token inválido",
        isExpired,
        code,
      });
    }

    console.info("Token validated successfully");

    // Build campaign status filter - quick mode only fetches ACTIVE
    const statusFilter = options.activeOnly 
      ? "&filtering=[{\"field\":\"effective_status\",\"operator\":\"IN\",\"value\":[\"ACTIVE\"]}]"
      : "&filtering=[{\"field\":\"effective_status\",\"operator\":\"IN\",\"value\":[\"ACTIVE\",\"PAUSED\"]}]";

    // Limit campaigns fetched in quick mode
    const campaignLimit = options.syncMode === "quick" ? 50 : 100;

    // Fetch campaigns
    console.info("Fetching campaigns...");
    const campaignsResponse = await fetchWithRetry(
      `${baseUrl}/${ad_account_id}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time,start_time,stop_time&limit=${campaignLimit}${statusFilter}&access_token=${access_token}`
    );
    const campaignsData = await campaignsResponse.json();

    if (campaignsData.error) {
      const fbError = campaignsData.error as FacebookApiError;
      const { message, code, isExpired } = parseFacebookError(fbError);

      return ok({
        success: false,
        error: message,
        isExpired,
        code,
      });
    }

    const campaigns = campaignsData.data || [];
    console.info(`Found ${campaigns.length} campaigns`);

    let totalAdsets = 0;
    let totalAds = 0;

    // In quick mode, only upsert campaigns and skip adsets/ads processing
    // This dramatically reduces API calls and time
    const campaignsToUpsert = campaigns.map((campaign: any) => ({
      fb_campaign_id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      daily_budget: campaign.daily_budget
        ? parseFloat(campaign.daily_budget) / 100
        : null,
      lifetime_budget: campaign.lifetime_budget
        ? parseFloat(campaign.lifetime_budget) / 100
        : null,
      created_time: campaign.created_time,
      updated_time: campaign.updated_time,
      start_time: campaign.start_time,
      stop_time: campaign.stop_time,
      metadata: campaign,
    }));

    // Batch upsert all campaigns at once
    if (campaignsToUpsert.length > 0) {
      await supabase.from("fb_campaigns").upsert(campaignsToUpsert, { onConflict: "fb_campaign_id" });
    }


    // Only fetch adsets/ads in full mode
    if (options.syncMode === "full") {
      await processBatch(campaigns, async (campaign: any) => {
        // Check timeout
        if (Date.now() - startTime > 80000) return;

        const adsetsResponse = await fetchWithRetry(
          `${baseUrl}/${campaign.id}/adsets?fields=id,name,status,daily_budget,lifetime_budget,billing_event,optimization_goal,bid_amount,targeting,created_time,updated_time&limit=100&access_token=${access_token}`
        );
        const adsetsData = await adsetsResponse.json();
        const adsets = adsetsData.data || [];
        totalAdsets += adsets.length;

        // Batch upsert adsets
        if (adsets.length > 0) {
          const adsetsToUpsert = adsets.map((adset: any) => ({
            fb_adset_id: adset.id,
            fb_campaign_id: campaign.id,
            name: adset.name,
            status: adset.status,
            daily_budget: adset.daily_budget ? parseFloat(adset.daily_budget) / 100 : null,
            lifetime_budget: adset.lifetime_budget ? parseFloat(adset.lifetime_budget) / 100 : null,
            billing_event: adset.billing_event,
            optimization_goal: adset.optimization_goal,
            bid_amount: adset.bid_amount ? parseFloat(adset.bid_amount) / 100 : null,
            targeting: adset.targeting,
            created_time: adset.created_time,
            updated_time: adset.updated_time,
            metadata: adset,
          }));
          await supabase.from("fb_adsets").upsert(adsetsToUpsert, { onConflict: "fb_adset_id" });
        }

        // Fetch ads
        if (!options.skipAds) {
          await processBatch(adsets, async (adset: any) => {
            if (Date.now() - startTime > 80000) return;

            const adsResponse = await fetchWithRetry(
              `${baseUrl}/${adset.id}/ads?fields=id,name,status,creative,created_time,updated_time&limit=100&access_token=${access_token}`
            );
            const adsData = await adsResponse.json();
            const ads = adsData.data || [];
            totalAds += ads.length;

            if (ads.length > 0) {
              const adsToUpsert = ads.map((ad: any) => ({
                fb_ad_id: ad.id,
                fb_adset_id: adset.id,
                fb_campaign_id: campaign.id,
                name: ad.name,
                status: ad.status,
                creative_id: ad.creative?.id,
                creative_name: ad.creative?.name,
                created_time: ad.created_time,
                updated_time: ad.updated_time,
                metadata: ad,
              }));
              await supabase.from("fb_ads").upsert(adsToUpsert, { onConflict: "fb_ad_id" });
            }
          }, 3);
        }
      }, 5);
    }

    console.info(`Processed ${totalAdsets} adsets, ${totalAds} ads`);

    // Fetch insights for the configured time window
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - options.daysBack);
    const dateStart = daysAgo.toISOString().split("T")[0];
    const dateStop = new Date().toISOString().split("T")[0];

    console.info(`Fetching daily insights from ${dateStart} to ${dateStop}...`);

    // Always fetch ad-level insights so metrics propagate to adsets and campaigns
    const insightsLevel = "ad";
    
    let allInsights: Array<{
      ad_id?: string;
      adset_id?: string;
      campaign_id: string;
      date_start: string;
      date_stop: string;
      impressions?: string;
      clicks?: string;
      spend?: string;
      reach?: string;
      cpc?: string;
      cpm?: string;
      ctr?: string;
      frequency?: string;
      conversions?: Array<{ value: string }>;
      cost_per_conversion?: Array<{ value: string }>;
    }> = [];

    let nextPageUrl: string | null =
      `${baseUrl}/${ad_account_id}/insights?fields=ad_id,adset_id,campaign_id,impressions,clicks,spend,reach,cpc,cpm,ctr,frequency,conversions,cost_per_conversion&level=${insightsLevel}&time_range={"since":"${dateStart}","until":"${dateStop}"}&time_increment=1&limit=500&access_token=${access_token}`;

    // Handle pagination with timeout protection
    const maxPages = options.syncMode === "quick" ? 20 : 50;
    let pageCount = 0;

    while (nextPageUrl && pageCount < maxPages) {
      const response = await fetchWithRetry(nextPageUrl);
      const data = await response.json() as {
        data?: typeof allInsights;
        paging?: { next?: string };
        error?: FacebookApiError;
      };

      if (data.error) {
        console.error("Error fetching insights:", data.error);
        break;
      }

      if (data.data) {
        allInsights = allInsights.concat(data.data);
      }

      nextPageUrl = data.paging?.next || null;
      pageCount++;

      if (nextPageUrl) {
        console.info(`Fetching insights page ${pageCount + 1} (${allInsights.length} so far)...`);
      }

      // Check if we're running too long
      if (Date.now() - startTime > 80000) { // 80 seconds
        console.warn("Approaching timeout, stopping insights pagination");
        break;
      }
    }

    console.info(`Total insights fetched: ${allInsights.length}`);

    // Delete existing insights for the date range first, then insert new ones
    // This avoids NULL conflict issues with upsert
    
    // Get unique campaign IDs from insights
    const campaignIds = [...new Set(allInsights.map(i => i.campaign_id))];
    
    if (campaignIds.length > 0 && allInsights.length > 0) {
      // Delete old metrics for these campaigns in this date range
      await supabase
        .from("fb_metrics")
        .delete()
        .in("fb_campaign_id", campaignIds)
        .gte("date_start", dateStart);

      // Insert all new insights in batches
      const BATCH_SIZE = 100;
      for (let i = 0; i < allInsights.length; i += BATCH_SIZE) {
        const batch = allInsights.slice(i, i + BATCH_SIZE);
        const insightsToInsert = batch.map(insight => ({
          fb_ad_id: insight.ad_id || null,
          fb_adset_id: insight.adset_id || null,
          fb_campaign_id: insight.campaign_id,
          date_start: insight.date_start,
          date_stop: insight.date_stop,
          impressions: parseInt(insight.impressions ?? "0") || 0,
          clicks: parseInt(insight.clicks ?? "0") || 0,
          spend: parseFloat(insight.spend ?? "0") || 0,
          reach: parseInt(insight.reach ?? "0") || 0,
          cpc: parseFloat(insight.cpc ?? "0") || 0,
          cpm: parseFloat(insight.cpm ?? "0") || 0,
          ctr: parseFloat(insight.ctr ?? "0") || 0,
          frequency: parseFloat(insight.frequency ?? "0") || 0,
          conversions: insight.conversions?.[0]?.value
            ? parseInt(insight.conversions[0].value) || 0
            : 0,
          cost_per_conversion: insight.cost_per_conversion?.[0]?.value
            ? parseFloat(insight.cost_per_conversion[0].value) || 0
            : 0,
          metadata: insight,
        }));

        await supabase.from("fb_metrics").insert(insightsToInsert);
      }
    }

    // Update last sync timestamp
    await supabase
      .from("fb_ads_config")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", config.id);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.info(`Facebook Ads sync completed in ${duration}s`);

    return ok({
      success: true,
      campaigns_synced: campaigns.length,
      adsets_synced: totalAdsets,
      ads_synced: totalAds,
      insights_synced: allInsights.length,
      sync_mode: options.syncMode,
      duration_seconds: parseFloat(duration),
    });
  } catch (error: unknown) {
    console.error("Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    );
  }
});
