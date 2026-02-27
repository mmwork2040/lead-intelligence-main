import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get('ALLOWED_ORIGIN') || '*',
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AIConfig {
  provider: "openai" | "anthropic" | "google";
  api_key: string;
  model: string;
}

function getProviderConfig(config: AIConfig) {
  const { provider, api_key, model } = config;

  switch (provider) {
    case "openai":
      return {
        url: "https://api.openai.com/v1/chat/completions",
        headers: {
          "Authorization": `Bearer ${api_key}`,
          "Content-Type": "application/json",
        },
        formatBody: (messages: any[], stream: boolean) => ({
          model,
          messages,
          stream,
        }),
      };
    case "anthropic":
      return {
        url: "https://api.anthropic.com/v1/messages",
        headers: {
          "x-api-key": api_key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        formatBody: (messages: any[], stream: boolean) => {
          const systemMsg = messages.find((m: any) => m.role === "system");
          const otherMsgs = messages.filter((m: any) => m.role !== "system");
          return {
            model,
            system: systemMsg?.content || "",
            messages: otherMsgs,
            max_tokens: 4096,
            stream,
          };
        },
      };
    case "google":
      return {
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        headers: {
          "Authorization": `Bearer ${api_key}`,
          "Content-Type": "application/json",
        },
        formatBody: (messages: any[], stream: boolean) => ({
          model,
          messages,
          stream,
        }),
      };
    default:
      throw new Error(`Provider não suportado: ${provider}`);
  }
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
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const context = body?.context || '';
    const stream = body?.stream !== false;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read AI config from system_config
    const { data: configRow, error: configError } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "ai_config")
      .maybeSingle();

    if (configError) {
      console.error("Error reading ai_config:", configError);
      return new Response(
        JSON.stringify({ error: "Erro ao ler configuração de IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiConfig = configRow?.value as unknown as AIConfig | null;

    if (!aiConfig?.provider || !aiConfig?.api_key || !aiConfig?.model) {
      return new Response(
        JSON.stringify({ error: "IA não configurada. O administrador precisa configurar o provider, modelo e chave de API nas configurações." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Collect analytics data for context — use 24h window for daily summary
    const is24hContext = context === 'resumo_diario_24h';
    const analyticsData = await collectAnalyticsData(supabase, is24hContext ? 1 : 30);

    const periodoLabel = is24hContext ? 'últimas 24 horas' : 'últimos 30 dias';
    const systemPrompt = `Você é um assistente inteligente especializado em análise de marketing digital, gestão de leads e otimização de campanhas.

## Seu papel:
- Analisar dados de leads, vendas, campanhas e métricas de Facebook Ads
- Gerar insights e relatórios baseados nos dados reais do sistema
- Sugerir melhorias para campanhas e estratégias de marketing
- Ajudar na importação e organização de leads
- Responder perguntas sobre performance do negócio

## Dados atuais do sistema:
${JSON.stringify(analyticsData, null, 2)}

## Diretrizes:
- Sempre base suas análises nos dados fornecidos
- Seja objetivo e forneça insights acionáveis
- Use formatação markdown para melhor legibilidade
- Inclua números e porcentagens quando relevante
- Sugira ações concretas quando apropriado
- Responda em português brasileiro
- Seja conciso mas completo

## Período dos dados: ${periodoLabel}
## Contexto atual: ${context || 'geral'}`;

    const providerConfig = getProviderConfig(aiConfig);

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(providerConfig.url, {
      method: "POST",
      headers: providerConfig.headers,
      body: JSON.stringify(providerConfig.formatBody(allMessages, stream)),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${aiConfig.provider} API error:`, response.status, errorText);

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Chave de API inválida ou sem permissão. Verifique a configuração nas Configurações do sistema." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao processar requisição de IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function collectAnalyticsData(supabase: any, days: number = 30) {
  const now = new Date();
  const periodAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const periodAgoStr = periodAgo.toISOString();

  try {
    const [leadsResult, purchasesResult, campaignsResult, productsResult, fbMetricsResult] = await Promise.all([
      supabase.from("leads").select("id, created_at, source, crm_status, utm_campaign").gte("created_at", periodAgoStr),
      supabase.from("purchases").select("id, value, gross_value, status, product_name, purchase_date, platform").gte("purchase_date", periodAgoStr),
      supabase.from("campaigns").select("id, name, slug, ad_spend, start_date, end_date"),
      supabase.from("products").select("id, name, slug, price, type, is_active"),
      supabase.from("fb_metrics").select("spend, impressions, clicks, conversions, ctr, cpc, cpm").gte("date_start", periodAgoStr.split("T")[0]),
    ]);

    const leads = leadsResult.data || [];
    const purchases = purchasesResult.data || [];
    const campaigns = campaignsResult.data || [];
    const products = productsResult.data || [];
    const fbMetrics = fbMetricsResult.data || [];

    const approvedPurchases = purchases.filter((p: any) => p.status === "approved");
    const totalRevenue = approvedPurchases.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
    const totalAdSpend = fbMetrics.reduce((sum: number, m: any) => sum + (m.spend || 0), 0);

    const leadsByStatus = leads.reduce((acc: any, lead: any) => {
      acc[lead.crm_status || "sem_status"] = (acc[lead.crm_status || "sem_status"] || 0) + 1;
      return acc;
    }, {});

    const leadsBySource = leads.reduce((acc: any, lead: any) => {
      acc[lead.source || "desconhecido"] = (acc[lead.source || "desconhecido"] || 0) + 1;
      return acc;
    }, {});

    const salesByProduct = approvedPurchases.reduce((acc: any, p: any) => {
      if (!acc[p.product_name]) acc[p.product_name] = { count: 0, revenue: 0 };
      acc[p.product_name].count += 1;
      acc[p.product_name].revenue += p.value || 0;
      return acc;
    }, {});

    const fbTotals = fbMetrics.reduce(
      (acc: any, m: any) => ({
        spend: acc.spend + (m.spend || 0),
        impressions: acc.impressions + (m.impressions || 0),
        clicks: acc.clicks + (m.clicks || 0),
        conversions: acc.conversions + (m.conversions || 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    );

    return {
      periodo: days === 1 ? "últimas 24 horas" : `últimos ${days} dias`,
      resumo: {
        totalLeads: leads.length,
        totalVendas: approvedPurchases.length,
        receitaTotal: totalRevenue,
        investimentoAds: totalAdSpend,
        roas: totalAdSpend > 0 ? (totalRevenue / totalAdSpend).toFixed(2) : "N/A",
        taxaConversao: leads.length > 0 ? ((approvedPurchases.length / leads.length) * 100).toFixed(1) + "%" : "0%",
      },
      leadsPorStatus: leadsByStatus,
      leadsPorFonte: leadsBySource,
      vendasPorProduto: salesByProduct,
      campanhasAtivas: campaigns.filter((c: any) => {
        const now = new Date();
        return (!c.start_date || new Date(c.start_date) <= now) && (!c.end_date || new Date(c.end_date) >= now);
      }).length,
      produtosAtivos: products.filter((p: any) => p.is_active).length,
      facebookAds: {
        investimento: fbTotals.spend,
        impressoes: fbTotals.impressions,
        cliques: fbTotals.clicks,
        conversoes: fbTotals.conversions,
        ctr: fbTotals.impressions > 0 ? ((fbTotals.clicks / fbTotals.impressions) * 100).toFixed(2) + "%" : "0%",
        cpc: fbTotals.clicks > 0 ? (fbTotals.spend / fbTotals.clicks).toFixed(2) : "N/A",
      },
    };
  } catch (error) {
    console.error("Error collecting analytics data:", error);
    return { error: "Não foi possível coletar dados do sistema" };
  }
}
