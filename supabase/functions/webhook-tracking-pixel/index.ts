import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    console.log('Pixel tracking data received:', payload);

    const {
      // Identity data
      visitor_id, // This comes from our tracking.js snippet
      name,
      email,
      phone,

      // Event context
      event_type = 'page_view',
      page_url,
      referrer_url,
      funnel_step_id = null,
      project_slug,

      // UTM parameters
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,

      // Device / Ads context
      user_agent,
      ip_address,
      fbp,
      fbc,

      metadata = {},
    } = payload;

    // We absolutely need either a visitor_id (anonymous tracking) OR an email/phone (known lead via direct form).
    if (!visitor_id && !email && !phone) {
      return new Response(
        JSON.stringify({ error: 'visitor_id or identification data (email/phone) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Normalize Personal Data if available
    const normalizedEmail = email ? email.toLowerCase().trim() : null;
    const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;

    let leadId: string | null = null;
    let isNewLead = false;

    // 2. Resolve Lead Identity (If identifiable data exists)
    if (normalizedEmail || normalizedPhone) {
      const query = supabase.from('leads').select('*').limit(1);

      if (normalizedEmail && normalizedPhone) {
        query.or(`email.eq.${normalizedEmail},phone.eq.${normalizedPhone}`);
      } else if (normalizedEmail) {
        query.eq('email', normalizedEmail);
      } else if (normalizedPhone) {
        query.eq('phone', normalizedPhone);
      }

      const { data: existingLeads, error: queryError } = await query;

      if (queryError) {
        console.error('Error querying leads:', queryError);
      }

      if (existingLeads && existingLeads.length > 0) {
        // Lead exists - Update fields if requested
        const existingLead = existingLeads[0];
        leadId = existingLead.lead_id;

        const updates: any = { updated_at: new Date().toISOString() };
        if (name && !existingLead.name) updates.name = name;
        if (normalizedEmail && !existingLead.email) updates.email = normalizedEmail;
        if (normalizedPhone && !existingLead.phone) updates.phone = normalizedPhone;
        // Keep initial tracking UTMs if empty
        if (utm_source && !existingLead.utm_source) updates.utm_source = utm_source;
        if (project_slug && !existingLead.project_slug) updates.project_slug = project_slug;

        if (Object.keys(updates).length > 1) {
          await supabase.from('leads').update(updates).eq('lead_id', leadId);
        }
      } else {
        // Create new lead
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert({
            name: name || null,
            email: normalizedEmail,
            phone: normalizedPhone,
            project_slug: project_slug || null,
            source: 'tracking-pixel',
            utm_source: utm_source || null,
            utm_medium: utm_medium || null,
            utm_campaign: utm_campaign || null,
            utm_content: utm_content || null,
            utm_term: utm_term || null,
          })
          .select('lead_id')
          .single();

        if (insertError || !newLead) {
          console.error('Error creating lead:', insertError);
        } else {
          leadId = newLead.lead_id;
          isNewLead = true;
        }
      }
    }

    // 3. Resolve / Merge Visitor Identity
    let dbVisitorId: string | null = null;

    if (visitor_id) {
      // Find visitor by UUID
      const { data: visitorData } = await supabase
        .from('visitors')
        .select('id, lead_id')
        .eq('visitor_uuid', visitor_id)
        .single();

      if (visitorData) {
        dbVisitorId = visitorData.id;

        // If the visitor already exists, update 'last_seen'
        const updates: any = { last_seen_at: new Date().toISOString() };

        // Identity Resolution Merge! 
        // If we found a Lead ID from this request, but this visitor profile doesn't have it yet, MERGE THEM.
        if (leadId && !visitorData.lead_id) {
          updates.lead_id = leadId;
          updates.merged_at = new Date().toISOString();
          console.log(`Identity Merge! Visitor ${visitor_id} is now Lead ${leadId}`);
        }

        await supabase.from('visitors').update(updates).eq('id', dbVisitorId);
      } else {
        // Create new visitor profile
        const { data: newVisitor } = await supabase
          .from('visitors')
          .insert({
            visitor_uuid: visitor_id,
            lead_id: leadId,
            merged_at: leadId ? new Date().toISOString() : null,
          })
          .select('id')
          .single();

        if (newVisitor) {
          dbVisitorId = newVisitor.id;
        }
      }
    }

    // 4. Save Tracking Event into Funnel Tracking
    if (dbVisitorId && page_url) {
      const { error: trackingError } = await supabase
        .from('tracking_events')
        .insert({
          visitor_id: dbVisitorId,
          lead_id: leadId,
          funnel_step_id: funnel_step_id,
          event_type,
          page_url,
          referrer_url,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_content,
          utm_term,
          user_agent,
          ip_address,
          fbp,
          fbc,
          metadata
        });

      if (trackingError) {
        console.error('Error saving tracking event:', trackingError);
      }
    }

    // 5. Save Legacy Lead Event (Keep backward compatibility)
    if (leadId && (normalizedEmail || normalizedPhone)) {
      await supabase
        .from('lead_events')
        .insert({
          lead_id: leadId,
          event_type: event_type === 'page_view' ? 'form_captured' : event_type,
          source: 'tracking-pixel',
          event_data: {
            ...payload,
            visitor_id,
            is_new: isNewLead,
          },
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: leadId,
        visitor_merged: !!(leadId && visitor_id),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Tracking pixel error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
