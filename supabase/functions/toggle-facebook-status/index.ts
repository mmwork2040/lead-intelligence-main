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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), { status: 401, headers: jsonHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
    }

    const { entityId, entityType, newStatus } = await req.json();

    if (!entityId || !entityType || !newStatus) {
      return new Response(JSON.stringify({ success: false, error: "entityId, entityType e newStatus são obrigatórios" }), { status: 400, headers: jsonHeaders });
    }

    if (!["campaign", "adset", "ad"].includes(entityType)) {
      return new Response(JSON.stringify({ success: false, error: "entityType deve ser campaign, adset ou ad" }), { status: 400, headers: jsonHeaders });
    }

    if (!["ACTIVE", "PAUSED"].includes(newStatus)) {
      return new Response(JSON.stringify({ success: false, error: "newStatus deve ser ACTIVE ou PAUSED" }), { status: 400, headers: jsonHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get active config for the access token
    const { data: config, error: configError } = await supabase
      .from("fb_ads_config")
      .select("access_token")
      .eq("is_active", true)
      .single();

    if (configError || !config) {
      return ok({ success: false, error: "Nenhuma configuração ativa do Facebook encontrada" });
    }

    const baseUrl = "https://graph.facebook.com/v21.0";

    // Update status via Facebook API
    const response = await fetch(`${baseUrl}/${entityId}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `status=${newStatus}&access_token=${config.access_token}`,
    });

    const data = await response.json();

    if (data.error) {
      console.error("Facebook API error:", data.error);
      return ok({
        success: false,
        error: data.error.message || "Erro na API do Facebook",
        code: data.error.code,
      });
    }

    // Update local database
    const tableMap: Record<string, { table: string; idColumn: string }> = {
      campaign: { table: "fb_campaigns", idColumn: "fb_campaign_id" },
      adset: { table: "fb_adsets", idColumn: "fb_adset_id" },
      ad: { table: "fb_ads", idColumn: "fb_ad_id" },
    };

    const { table, idColumn } = tableMap[entityType];
    await supabase
      .from(table)
      .update({ status: newStatus })
      .eq(idColumn, entityId);

    console.info(`Updated ${entityType} ${entityId} to ${newStatus}`);

    return ok({ success: true, entityId, entityType, newStatus });
  } catch (error: unknown) {
    console.error("Toggle error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
