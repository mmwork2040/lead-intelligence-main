import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface N8NWebhook {
  event_type: string;
  lead: {
    name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  project_slug?: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify webhook secret if configured
    const webhookSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    if (webhookSecret) {
      const receivedSecret = req.headers.get('x-webhook-secret');
      if (receivedSecret !== webhookSecret) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
    }

    const payload: N8NWebhook = await req.json();

    if (!payload?.lead) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid payload: missing lead' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('N8N webhook received:', payload.event_type);

    // Log webhook
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        source: 'n8n',
        event_type: payload.event_type,
        payload: payload,
        processed: false
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging webhook:', logError);
    }

    const lead = payload.lead;
    let leadId: string | null = null;

    // Try to find existing lead
    let existingLeads = null;
    if (lead.email) {
      const { data } = await supabase.from('leads').select('*').eq('email', lead.email).limit(1);
      if (data && data.length > 0) existingLeads = data;
    }
    if (!existingLeads && lead.phone) {
      const { data } = await supabase.from('leads').select('*').eq('phone', lead.phone).limit(1);
      if (data && data.length > 0) existingLeads = data;
    }
    if (!existingLeads && lead.cpf) {
      const { data } = await supabase.from('leads').select('*').eq('cpf', lead.cpf).limit(1);
      if (data && data.length > 0) existingLeads = data;
    }

    if (existingLeads && existingLeads.length > 0) {
      // Update existing lead
      leadId = existingLeads[0].lead_id;

      const updateData: Record<string, string | object> = {
        updated_at: new Date().toISOString()
      };

      if (lead.name) updateData.name = lead.name;
      if (lead.email) updateData.email = lead.email;
      if (lead.phone) updateData.phone = lead.phone;
      if (lead.cpf) updateData.cpf = lead.cpf;

      // Handle updating observacoes for existing
      const observacoesN8n = payload.metadata ? `Dados extras: ${JSON.stringify(payload.metadata)}` : '';
      if (observacoesN8n) {
        const existingMetadata = existingLeads[0].metadata || {};
        updateData.metadata = {
          ...existingMetadata,
          observacoes: existingMetadata.observacoes
            ? `${existingMetadata.observacoes}\n[Update n8n]: ${observacoesN8n}`
            : observacoesN8n
        }
      }

      await supabase
        .from('leads')
        .update(updateData)
        .eq('lead_id', leadId);

      console.log('Lead updated:', leadId);
    }

    if (!leadId) {
      // Create new lead
      const observacoesN8n = payload.metadata ? `Dados extras: ${JSON.stringify(payload.metadata)}` : '';

      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          cpf: lead.cpf,
          source: 'n8n',
          utm_source: payload.utm?.source,
          utm_medium: payload.utm?.medium,
          utm_campaign: payload.utm?.campaign,
          utm_content: payload.utm?.content,
          utm_term: payload.utm?.term,
          project_slug: payload.project_slug,
          metadata: {
            ...payload.metadata,
            observacoes: observacoesN8n
          }
        })
        .select('lead_id')
        .single();

      if (leadError) {
        throw new Error(`Error creating lead: ${leadError.message}`);
      }

      leadId = newLead.lead_id;
      console.log('New lead created:', leadId);
    }

    // Create lead event
    await supabase
      .from('lead_events')
      .insert({
        lead_id: leadId,
        event_type: payload.event_type,
        event_data: payload,
        source: 'n8n'
      });

    // Update webhook log as processed
    if (logData) {
      await supabase
        .from('webhook_logs')
        .update({ processed: true, lead_id: leadId })
        .eq('id', logData.id);
    }

    return new Response(
      JSON.stringify({ success: true, lead_id: leadId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error processing N8N webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});