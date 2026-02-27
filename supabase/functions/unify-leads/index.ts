import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Lead {
  lead_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  metadata: any;
  project_slug: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  created_at: string;
  updated_at: string;
}

interface UnificationResult {
  success: boolean;
  master_lead_id?: string;
  merged_lead_ids?: string[];
  merge_logs?: any[];
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { lead_id, auto_merge = false } = await req.json();

    if (!lead_id || typeof lead_id !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'lead_id is required and must be a string' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`🔍 Starting unification process for lead: ${lead_id}`);

    // 1. Buscar o lead principal
    const { data: mainLead, error: mainLeadError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('lead_id', lead_id)
      .single();

    if (mainLeadError || !mainLead) {
      throw new Error('Lead não encontrado');
    }

    console.log('📋 Main lead data:', {
      lead_id: mainLead.lead_id,
      email: mainLead.email,
      phone: mainLead.phone,
      cpf: mainLead.cpf,
      name: mainLead.name
    });

    // 2. Buscar duplicatas usando as regras de unificação
    const duplicates: { lead: Lead; reason: string }[] = [];

    // Regra 1: Telefone (mais forte)
    if (mainLead.phone) {
      const normalizedPhone = mainLead.phone.replace(/[^0-9]/g, '');
      if (normalizedPhone.length >= 10) {
        const { data: phoneMatches } = await supabaseClient
          .from('leads')
          .select('*')
          .neq('lead_id', lead_id)
          .not('phone', 'is', null);

        if (phoneMatches) {
          for (const match of phoneMatches) {
            const matchPhone = match.phone?.replace(/[^0-9]/g, '') || '';
            if (matchPhone === normalizedPhone) {
              duplicates.push({ lead: match, reason: 'phone' });
              console.log(`📞 Phone match found: ${match.lead_id}`);
            }
          }
        }
      }
    }

    // Regra 2: Email (forte)
    if (mainLead.email) {
      const normalizedEmail = mainLead.email.toLowerCase().trim();
      const { data: emailMatches } = await supabaseClient
        .from('leads')
        .select('*')
        .neq('lead_id', lead_id)
        .ilike('email', normalizedEmail);

      if (emailMatches) {
        for (const match of emailMatches) {
          if (!duplicates.some(d => d.lead.lead_id === match.lead_id)) {
            duplicates.push({ lead: match, reason: 'email' });
            console.log(`📧 Email match found: ${match.lead_id}`);
          }
        }
      }
    }

    // Regra 3: CPF (forte)
    if (mainLead.cpf) {
      const normalizedCpf = mainLead.cpf.replace(/[^0-9]/g, '');
      if (normalizedCpf.length === 11) {
        const { data: cpfMatches } = await supabaseClient
          .from('leads')
          .select('*')
          .neq('lead_id', lead_id)
          .not('cpf', 'is', null);

        if (cpfMatches) {
          for (const match of cpfMatches) {
            const matchCpf = match.cpf?.replace(/[^0-9]/g, '') || '';
            if (matchCpf === normalizedCpf) {
              if (!duplicates.some(d => d.lead.lead_id === match.lead_id)) {
                duplicates.push({ lead: match, reason: 'cpf' });
                console.log(`🆔 CPF match found: ${match.lead_id}`);
              }
            }
          }
        }
      }
    }

    // Regra 4: Nome + 4 últimos dígitos do telefone (fraco - requer revisão manual)
    if (mainLead.name && mainLead.phone) {
      const normalizedName = mainLead.name.toLowerCase().trim();
      const phoneDigits = mainLead.phone.replace(/[^0-9]/g, '').slice(-4);

      if (phoneDigits.length === 4) {
        const { data: nameMatches } = await supabaseClient
          .from('leads')
          .select('*')
          .neq('lead_id', lead_id)
          .ilike('name', `%${normalizedName}%`)
          .not('phone', 'is', null);

        if (nameMatches) {
          for (const match of nameMatches) {
            const matchPhoneDigits = match.phone?.replace(/[^0-9]/g, '').slice(-4) || '';
            if (matchPhoneDigits === phoneDigits) {
              if (!duplicates.some(d => d.lead.lead_id === match.lead_id)) {
                duplicates.push({ lead: match, reason: 'name_phone_partial' });
                console.log(`👤 Name+Phone partial match found: ${match.lead_id}`);
              }
            }
          }
        }
      }
    }

    console.log(`🔢 Found ${duplicates.length} potential duplicates`);

    if (duplicates.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma duplicata encontrada',
          duplicates: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Se auto_merge = false, retornar apenas as duplicatas para revisão manual
    if (!auto_merge) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `${duplicates.length} duplicata(s) encontrada(s) - revisão manual necessária`,
          duplicates: duplicates.map(d => ({
            lead_id: d.lead.lead_id,
            name: d.lead.name,
            email: d.lead.email,
            phone: d.lead.phone,
            cpf: d.lead.cpf,
            reason: d.reason,
            created_at: d.lead.created_at
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Se auto_merge = true, realizar unificação automática
    const mergeLogs = [];

    for (const { lead: duplicate, reason } of duplicates) {
      console.log(`🔄 Merging lead ${duplicate.lead_id} into ${mainLead.lead_id}`);

      // Identificar conflitos (campos não vazios diferentes)
      const conflicts: string[] = [];
      const mergedData: any = { ...duplicate };

      if (mainLead.email && duplicate.email && mainLead.email !== duplicate.email) {
        conflicts.push('email');
      }
      if (mainLead.phone && duplicate.phone && mainLead.phone !== duplicate.phone) {
        conflicts.push('phone');
      }
      if (mainLead.cpf && duplicate.cpf && mainLead.cpf !== duplicate.cpf) {
        conflicts.push('cpf');
      }
      if (mainLead.name && duplicate.name && mainLead.name !== duplicate.name) {
        conflicts.push('name');
      }

      // Preencher campos vazios do lead principal
      const updates: any = {};
      if (!mainLead.email && duplicate.email) updates.email = duplicate.email;
      if (!mainLead.phone && duplicate.phone) updates.phone = duplicate.phone;
      if (!mainLead.cpf && duplicate.cpf) updates.cpf = duplicate.cpf;
      if (!mainLead.name && duplicate.name) updates.name = duplicate.name;
      if (!mainLead.utm_source && duplicate.utm_source) updates.utm_source = duplicate.utm_source;
      if (!mainLead.utm_medium && duplicate.utm_medium) updates.utm_medium = duplicate.utm_medium;
      if (!mainLead.utm_campaign && duplicate.utm_campaign) updates.utm_campaign = duplicate.utm_campaign;
      if (!mainLead.utm_content && duplicate.utm_content) updates.utm_content = duplicate.utm_content;
      if (!mainLead.utm_term && duplicate.utm_term) updates.utm_term = duplicate.utm_term;

      // Atualizar lead principal com dados preenchidos
      if (Object.keys(updates).length > 0) {
        await supabaseClient
          .from('leads')
          .update(updates)
          .eq('lead_id', mainLead.lead_id);
        
        console.log('✅ Updated main lead with filled data:', updates);
      }

      // Transferir eventos do lead duplicado para o principal
      await supabaseClient
        .from('lead_events')
        .update({ lead_id: mainLead.lead_id })
        .eq('lead_id', duplicate.lead_id);

      // Transferir compras do lead duplicado para o principal
      await supabaseClient
        .from('purchases')
        .update({ lead_id: mainLead.lead_id })
        .eq('lead_id', duplicate.lead_id);

      // Criar log de unificação
      const { data: logData } = await supabaseClient
        .from('lead_merge_logs')
        .insert({
          master_lead_id: mainLead.lead_id,
          merged_lead_id: duplicate.lead_id,
          merge_reason: reason,
          merged_data: mergedData,
          conflict_fields: conflicts,
          reviewed: conflicts.length === 0 // Auto-aprovado se não houver conflitos
        })
        .select()
        .single();

      mergeLogs.push(logData);

      // Deletar lead duplicado (soft delete via updated_at)
      await supabaseClient
        .from('leads')
        .delete()
        .eq('lead_id', duplicate.lead_id);

      console.log(`✅ Lead ${duplicate.lead_id} merged and deleted`);

      // Criar evento de unificação
      await supabaseClient
        .from('lead_events')
        .insert({
          lead_id: mainLead.lead_id,
          event_type: 'lead_merged',
          source: 'system',
          event_data: {
            merged_lead_id: duplicate.lead_id,
            reason,
            conflicts,
            auto_merged: true
          }
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${duplicates.length} lead(s) unificado(s) com sucesso`,
        master_lead_id: mainLead.lead_id,
        merged_lead_ids: duplicates.map(d => d.lead.lead_id),
        merge_logs: mergeLogs
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in unify-leads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao unificar leads';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
