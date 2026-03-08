import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManyChatWebhook {
  event: string;
  subscriber: {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    phone?: string;
    email?: string;
    whatsapp_phone_number?: string;
  };
  custom_fields?: Record<string, unknown>;
  tags?: string[];
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
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
    const webhookSecret = Deno.env.get('MANYCHAT_WEBHOOK_SECRET');
    if (webhookSecret) {
      const receivedSecret = req.headers.get('x-webhook-secret');
      if (receivedSecret !== webhookSecret) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
    }

    const payload: ManyChatWebhook = await req.json();

    if (!payload?.subscriber) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid payload: missing subscriber' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('ManyChat webhook received:', payload.event);

    // Log webhook
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        source: 'manychat',
        event_type: payload.event,
        payload: payload,
        processed: false
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging webhook:', logError);
    }

    const subscriber = payload.subscriber;
    const fullName = subscriber.name || `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim();
    const phone = subscriber.whatsapp_phone_number || subscriber.phone;

    let leadId: string | null = null;

    // Try to find existing lead
    let existingLeads = null;
    if (phone) {
      const { data } = await supabase.from('leads').select('*').eq('phone', phone).limit(1);
      if (data && data.length > 0) existingLeads = data;
    }
    if (!existingLeads && subscriber.email) {
      const { data } = await supabase.from('leads').select('*').eq('email', subscriber.email).limit(1);
      if (data && data.length > 0) existingLeads = data;
    }

    if (existingLeads && existingLeads.length > 0) {
      // Update existing lead
      leadId = existingLeads[0].lead_id;

      const updateData: Record<string, string | object> = {
        updated_at: new Date().toISOString()
      };

      if (fullName) updateData.name = fullName;
      if (subscriber.email) updateData.email = subscriber.email;
      if (phone) updateData.phone = phone;

      // Handle updating observacoes for existing too
      let observacoesManychat = ``;
      if (payload.tags && payload.tags.length > 0) {
        observacoesManychat += `Tags: ${payload.tags.join(', ')}. `;
      }
      if (payload.custom_fields && Object.keys(payload.custom_fields).length > 0) {
        observacoesManychat += `Custom Fields: ${JSON.stringify(payload.custom_fields)}.`;
      }

      if (observacoesManychat) {
        // Keep existing metadata if possible
        const existingMetadata = existingLeads[0].metadata || {};
        updateData.metadata = {
          ...existingMetadata,
          observacoes: existingMetadata.observacoes
            ? `${existingMetadata.observacoes}\n[Update Manychat]: ${observacoesManychat}`
            : observacoesManychat
        }
      }

      await supabase
        .from('leads')
        .update(updateData)
        .eq('lead_id', leadId);

      console.log('Lead updated:', leadId);
    } else {
      // Create new lead
      let observacoesManychat = ``;
      if (payload.tags && payload.tags.length > 0) {
        observacoesManychat += `Tags: ${payload.tags.join(', ')}. `;
      }
      if (payload.custom_fields && Object.keys(payload.custom_fields).length > 0) {
        observacoesManychat += `Custom Fields: ${JSON.stringify(payload.custom_fields)}.`;
      }

      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: fullName,
          email: subscriber.email,
          phone: phone,
          source: 'manychat',
          project_slug: payload.utm?.campaign ? payload.utm.campaign.toLowerCase().replace(/\s+/g, '-') : null,
          utm_source: payload.utm?.source,
          utm_medium: payload.utm?.medium,
          utm_campaign: payload.utm?.campaign,
          metadata: {
            manychat_event: payload.event,
            manychat_subscriber_id: subscriber.id,
            tags: payload.tags,
            custom_fields: payload.custom_fields,
            observacoes: observacoesManychat
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
        event_type: payload.event,
        event_data: {
          subscriber: payload.subscriber,
          tags: payload.tags,
          custom_fields: payload.custom_fields
        },
        source: 'manychat'
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
    console.error('Error processing ManyChat webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});