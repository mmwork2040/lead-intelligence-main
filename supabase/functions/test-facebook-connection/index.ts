import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get('ALLOWED_ORIGIN') || '*',
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { accessToken, adAccountId, checkOnly } = body;

    // If checkOnly mode, fetch credentials from database
    let tokenToUse = accessToken;
    let accountIdToUse = adAccountId;

    if (checkOnly) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: config, error: configError } = await supabase
        .from("fb_ads_config")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (configError || !config) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Nenhuma configuração do Facebook Ads encontrada",
            isConfigured: false
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      tokenToUse = config.access_token;
      accountIdToUse = config.ad_account_id;
    }

    if (!tokenToUse || !accountIdToUse) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 400,
          error: "Missing accessToken or adAccountId",
          message: "Informe accessToken e adAccountId para testar a conexão.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean the ad account ID - remove "act_" prefix if present
    const cleanAdAccountId = accountIdToUse.replace(/^act_/, "");

    const accountUrl =
      `https://graph.facebook.com/v18.0/act_${cleanAdAccountId}?fields=id,name,account_status,currency&access_token=${tokenToUse}`;
    const accountResponse = await fetch(accountUrl);

    if (!accountResponse.ok) {
      const fbError = await accountResponse.json();

      // Check if it's a permission error
      const errorMessage = fbError?.error?.message || "";
      const errorCode = fbError?.error?.code;

      // Check for expired token
      const isExpired =
        errorMessage.toLowerCase().includes("session has expired") ||
        errorMessage.toLowerCase().includes("expired");

      // IMPORTANT:
      // We always return HTTP 200 for expected/handled failures so the client
      // can safely read the JSON payload without treating it as a runtime error.
      if (errorCode === 190 || isExpired) {
        return new Response(
          JSON.stringify({
            success: false,
            isExpired: true,
            code: 401,
            error: "Token expirado",
            message:
              "O Access Token do Facebook expirou. Gere um novo token no Facebook Graph API Explorer.",
            details: fbError,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (errorCode === 100 || errorCode === 200 || errorMessage.includes("permission")) {
        return new Response(
          JSON.stringify({
            success: false,
            code: 403,
            error: "⚠️ Token sem permissões necessárias",
            message:
              "O Access Token não tem permissão para acessar esta conta de anúncios. Verifique se: 1) O token possui as permissões ads_read e ads_management, 2) Você tem acesso à conta de anúncios informada.",
            solution:
              "1. Acesse: https://developers.facebook.com/tools/explorer/\n2. Selecione seu App\n3. Clique em 'Generate Access Token'\n4. Marque: ads_read e ads_management\n5. Copie o novo token e cole acima",
            details: fbError,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          code: 400,
          error: "Não foi possível acessar a conta de anúncios",
          message: `Erro ao acessar Ad Account ID: ${cleanAdAccountId}. Verifique se o ID está correto e se você tem acesso a esta conta.`,
          details: fbError,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accountData = await accountResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        isExpired: false,
        message: "Conexão testada com sucesso!",
        account_id: accountData.id,
        account_name: accountData.name,
        account_status: accountData.account_status,
        currency: accountData.currency
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error testing Facebook connection:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Erro ao testar conexão",
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
