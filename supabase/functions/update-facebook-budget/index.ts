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

        const { entityId, entityType, newBudget } = await req.json();

        if (!entityId || !entityType || newBudget === undefined) {
            return new Response(JSON.stringify({ success: false, error: "entityId, entityType e newBudget são obrigatórios" }), { status: 400, headers: jsonHeaders });
        }

        if (!["campaign", "adset"].includes(entityType)) {
            return new Response(JSON.stringify({ success: false, error: "entityType deve ser campaign ou adset" }), { status: 400, headers: jsonHeaders });
        }

        if (isNaN(newBudget) || newBudget < 0) {
            return new Response(JSON.stringify({ success: false, error: "newBudget deve ser numérico e não negativo (em centavos)" }), { status: 400, headers: jsonHeaders });
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

        // Update budget via Facebook API
        // daily_budget represents full budget in cents natively by Facebook API
        const response = await fetch(`${baseUrl}/${entityId}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `daily_budget=${Math.round(newBudget)}&access_token=${config.access_token}`,
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

        // Update local database to reflect the new budget
        const tableMap: Record<string, { table: string; idColumn: string }> = {
            campaign: { table: "fb_campaigns", idColumn: "fb_campaign_id" },
            adset: { table: "fb_adsets", idColumn: "fb_adset_id" },
        };

        const { table, idColumn } = tableMap[entityType];
        await supabase
            .from(table)
            .update({ daily_budget: Math.round(newBudget) })
            .eq(idColumn, entityId);

        console.info(`Updated ${entityType} ${entityId} daily budget to ${newBudget}`);

        return ok({ success: true, entityId, entityType, newBudget });
    } catch (error: unknown) {
        console.error("Update budget error:", error);
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        return new Response(JSON.stringify({ success: false, error: msg }), {
            status: 500,
            headers: jsonHeaders,
        });
    }
});
