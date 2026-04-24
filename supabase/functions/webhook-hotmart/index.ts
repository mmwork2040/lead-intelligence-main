import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok',
};

interface HotmartWebhook {
  event: string;
  version?: string;
  data: {
    buyer: {
      name: string;
      email: string;
      phone?: string;
      document?: string;
      address?: {
        zip_code?: string;
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        country?: string;
      };
    };
    product: {
      name: string;
      id: number | string;
    };
    purchase: {
      status: string;
      price?: {
        value: number;
        currency_value: string;
      };
      payment?: {
        type: string;
        installments_number?: number;
      };
      transaction: string;
      order_date: number;
      approved_date?: number;
    };
    commissions?: Array<{
      source: string;
      value: number;
      currency_value: string;
    }>;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      content?: string;
      term?: string;
    };
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Validate Hotmart webhook token if configured
    const expectedToken = Deno.env.get('HOTMART_HOTTOK');
    if (expectedToken) {
      const receivedToken = req.headers.get('x-hotmart-hottok');
      if (receivedToken !== expectedToken) {
        console.error('Invalid Hotmart hottok token');
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized - Invalid token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      console.log('Hotmart token validated successfully');
    } else {
      console.error('HOTMART_HOTTOK not configured - rejecting request');
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook authentication not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: HotmartWebhook = await req.json();

    if (!payload?.data?.buyer) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid payload: missing data.buyer' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Hotmart webhook received:', payload.event);

    // Log webhook
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        source: 'hotmart',
        event_type: payload.event,
        payload: payload,
        processed: false
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging webhook:', logError);
    }

    // Helper function to get active campaign slug or fallback
    const getActiveCampaignSlug = async (): Promise<string> => {
      // Try to find an active campaign
      const now = new Date().toISOString().split('T')[0];
      const { data: activeCampaigns } = await supabase
        .from('campaigns')
        .select('slug')
        .lte('start_date', now)
        .gte('end_date', now)
        .limit(1);

      if (activeCampaigns && activeCampaigns.length > 0) {
        return activeCampaigns[0].slug;
      }

      // Fallback to vendas-mes-YYYY-MM
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `vendas-mes-${year}-${month}`;
    };

    // Process lead unification
    const buyer = payload.data.buyer;
    let leadId: string | null = null;

    // Generate project_slug: try UTM first, then active campaign or month fallback
    let projectSlug = payload.data.utm?.campaign
      ? payload.data.utm.campaign.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : null;

    if (!projectSlug) {
      projectSlug = await getActiveCampaignSlug();
    }

    console.log('Generated project_slug:', projectSlug);

    // Normalize buyer data
    const normalizedEmail = buyer.email?.trim().toLowerCase();
    const normalizedPhone = buyer.phone?.replace(/\D/g, '');
    const normalizedCpf = buyer.document?.replace(/\D/g, '');

    console.log('Normalized data:', { normalizedEmail, normalizedPhone, normalizedCpf });

    // Try to find existing lead
    let existingLeads = null;
    if (normalizedEmail) {
      const { data } = await supabase.from('leads').select('*').eq('email', normalizedEmail).limit(1);
      if (data && data.length > 0) existingLeads = data;
    }
    if (!existingLeads && normalizedPhone && normalizedPhone.length >= 10) {
      const { data } = await supabase.from('leads').select('*').eq('phone', normalizedPhone).limit(1);
      if (data && data.length > 0) existingLeads = data;
    }
    if (!existingLeads && normalizedCpf && normalizedCpf.length >= 11) {
      const { data } = await supabase.from('leads').select('*').eq('cpf', normalizedCpf).limit(1);
      if (data && data.length > 0) existingLeads = data;
    }

    console.log('Existing leads found:', existingLeads?.length || 0);

    if (existingLeads && existingLeads.length > 0) {
      // Update existing lead
      leadId = existingLeads[0].lead_id;

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (!existingLeads[0].name && buyer.name) updateData.name = buyer.name;
      if (!existingLeads[0].email && normalizedEmail) updateData.email = normalizedEmail;
      if (!existingLeads[0].phone && normalizedPhone) updateData.phone = normalizedPhone;
      if (!existingLeads[0].cpf && normalizedCpf) updateData.cpf = normalizedCpf;

      // Update project_slug if not set and we have one from UTM
      if (!existingLeads[0].project_slug && projectSlug) {
        updateData.project_slug = projectSlug;
        console.log('Updating lead with project_slug:', projectSlug);
      }

      await supabase
        .from('leads')
        .update(updateData)
        .eq('lead_id', leadId);

      console.log('Lead updated:', leadId);
    } else {
      // Create new lead
      const observacoesHotmart = `Produto: ${payload.data.product.name} (ID: ${payload.data.product.id}). Transação: ${payload.data.purchase?.transaction || "N/A"}. Status: ${payload.data.purchase?.status || "N/A"}.`;

      const leadInsertData: Record<string, any> = {
        name: buyer.name,
        email: normalizedEmail,
        phone: normalizedPhone,
        cpf: normalizedCpf,
        source: payload.data.utm?.source || null,
        project_slug: projectSlug,
        utm_source: payload.data.utm?.source,
        utm_medium: payload.data.utm?.medium,
        utm_campaign: payload.data.utm?.campaign,
        utm_content: payload.data.utm?.content,
        utm_term: payload.data.utm?.term,
        metadata: {
          hotmart_event: payload.event,
          version: payload.version,
          observacoes: observacoesHotmart
        }
      };

      // Add address data if available
      if (buyer.address) {
        if (buyer.address.zip_code) leadInsertData.zip_code = buyer.address.zip_code;
        if (buyer.address.street) leadInsertData.street = buyer.address.street;
        if (buyer.address.number) leadInsertData.street_number = buyer.address.number;
        if (buyer.address.complement) leadInsertData.complement = buyer.address.complement;
        if (buyer.address.neighborhood) leadInsertData.neighborhood = buyer.address.neighborhood;
        if (buyer.address.city) leadInsertData.city = buyer.address.city;
        if (buyer.address.state) leadInsertData.state = buyer.address.state;
        if (buyer.address.country) leadInsertData.country = buyer.address.country;
      }

      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert(leadInsertData)
        .select('lead_id')
        .single();

      if (leadError) {
        throw new Error(`Error creating lead: ${leadError.message}`);
      }

      leadId = newLead.lead_id;
      console.log('New lead created with project_slug:', leadId, projectSlug);
    }

    // Detect if this is a tracking pixel anonymous user upgrading to a known buyer
    let visitorId = null;
    if (leadId) {
      const { data: visitorMatch } = await supabase
        .from('visitors')
        .select('id')
        .eq('lead_id', leadId)
        .limit(1);

      if (visitorMatch && visitorMatch.length > 0) {
        visitorId = visitorMatch[0].id;
        console.log('Hotmart buyer matched to tracking visitor profile:', visitorId);
      }
    }

    // Create lead event (CRM Timeline)
    await supabase
      .from('lead_events')
      .insert({
        lead_id: leadId,
        event_type: payload.event,
        event_data: {
          ...payload.data,
          visitor_id: visitorId // Link the anonymous visitor id to the purchase event
        },
        source: 'hotmart'
      });

    // If there's an active visitor, log this as a Funnel Conversion Event!
    if (visitorId) {
      await supabase
        .from('tracking_events')
        .insert({
          visitor_id: visitorId,
          lead_id: leadId,
          event_type: payload.event, // e.g., 'PURCHASE_APPROVED'
          page_url: 'hotmart_webhook',
          referrer_url: 'hotmart',
          utm_source: payload.data.utm?.source,
          utm_medium: payload.data.utm?.medium,
          utm_campaign: payload.data.utm?.campaign,
          utm_content: payload.data.utm?.content,
          utm_term: payload.data.utm?.term,
          metadata: { hotmart_transaction: payload.data.purchase?.transaction }
        });
    }

    // Detect if it's a subscription event
    const isSubscription = payload.event.includes('SUBSCRIPTION');
    const subscriptionId = isSubscription && payload.data.purchase?.transaction
      ? `sub_${payload.data.purchase.transaction}`
      : null;

    // If it's a purchase event, create purchase record
    if (payload.event.includes('PURCHASE') || payload.event.includes('SALE') || isSubscription) {
      const purchase = payload.data.purchase;

      // Convert timestamp to ISO date
      const purchaseDate = purchase.order_date
        ? new Date(purchase.order_date).toISOString()
        : new Date().toISOString();

      // Extract values from commissions array
      const producerCommission = payload.data.commissions?.find(
        c => c.source === 'PRODUCER'
      );
      const marketplaceCommission = payload.data.commissions?.find(
        c => c.source === 'MARKETPLACE'
      );

      // Net value (what you receive) = PRODUCER commission
      const netValue = producerCommission?.value || purchase.price?.value || 0;

      // Platform fee = MARKETPLACE commission
      const platformFee = marketplaceCommission?.value || 0;

      // Gross value = original purchase price
      const grossValue = purchase.price?.value || 0;

      console.log('Processing purchase:', {
        transaction: purchase.transaction,
        grossValue: grossValue,
        netValue: netValue,
        platformFee: platformFee,
        date: purchaseDate
      });

      // Normalize status mapping
      const rawStatus = purchase.status.toUpperCase();
      let normalizedStatus = rawStatus.toLowerCase();
      
      const approvedStatuses = ['APPROVED', 'COMPLETE', 'COMPLETED'];
      const refundStatuses = ['REFUNDED', 'CHARGEBACK'];
      const canceledStatuses = ['CANCELED', 'CANCELLED', 'EXPIRED'];
      
      if (approvedStatuses.includes(rawStatus)) {
        normalizedStatus = 'approved';
      } else if (refundStatuses.includes(rawStatus)) {
        normalizedStatus = 'refunded';
      } else if (canceledStatuses.includes(rawStatus)) {
        normalizedStatus = 'canceled';
      }

      console.log('Processing purchase status:', {
        transaction: purchase.transaction,
        rawStatus,
        normalizedStatus
      });

      // Check if purchase already exists
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id, status')
        .eq('transaction_id', purchase.transaction)
        .limit(1);

      if (existingPurchase && existingPurchase.length > 0) {
        // Update existing purchase
        const { error: updateError } = await supabase
          .from('purchases')
          .update({
            status: normalizedStatus,
            updated_at: new Date().toISOString(),
            metadata: { 
              ...payload.data,
              last_event: payload.event, 
              last_version: payload.version 
            }
          })
          .eq('transaction_id', purchase.transaction);

        if (updateError) {
          console.error('Error updating purchase:', updateError);
          throw new Error(`Error updating purchase: ${updateError.message}`);
        }
        
        console.log('Purchase status updated:', purchase.transaction, 'to', normalizedStatus);
      } else {
        // Intelligent product matching (keep existing logic)
        let productSlug = null;
        const hotmartCode = String(payload.data.product.id);
        const productName = payload.data.product.name;

        // 1. Try to find product by Hotmart code in product_offers
        const { data: offerData } = await supabase
          .from('product_offers')
          .select('product_id, products(slug)')
          .eq('hotmart_code', hotmartCode)
          .single();

        if (offerData && offerData.products) {
          productSlug = (offerData.products as any).slug;
          console.log('Product found via Hotmart code:', hotmartCode, '-> slug:', productSlug);
        }

        // 2. If not found, try exact name match
        if (!productSlug) {
          const { data: exactMatch } = await supabase
            .from('products')
            .select('slug')
            .ilike('name', productName)
            .single();

          if (exactMatch) {
            productSlug = exactMatch.slug;
            console.log('Product found via exact name match:', productName, '-> slug:', productSlug);
          }
        }

        // 3. If not found, try alias matching in metadata
        if (!productSlug) {
          const { data: allProducts } = await supabase
            .from('products')
            .select('slug, metadata')
            .eq('is_active', true);

          if (allProducts) {
            const normalizedName = productName.toLowerCase().trim();

            for (const product of allProducts) {
              const metadata = product.metadata as Record<string, any> || {};
              const aliases: string[] = metadata.aliases || [];

              const matchedAlias = aliases.find(alias =>
                alias.toLowerCase() === normalizedName ||
                normalizedName.includes(alias.toLowerCase()) ||
                alias.toLowerCase().includes(normalizedName)
              );

              if (matchedAlias) {
                productSlug = product.slug;
                console.log('Product found via alias match:', productName, '-> alias:', matchedAlias, '-> slug:', productSlug);
                break;
              }
            }
          }
        }

        // 4. If not found, try fuzzy matching with keywords
        if (!productSlug) {
          const { data: allProducts } = await supabase
            .from('products')
            .select('slug, name')
            .eq('is_active', true);

          if (allProducts) {
            const normalizedName = productName.toLowerCase();
            const keywords = normalizedName.split(/\s+/).filter(w => w.length >= 4);

            for (const product of allProducts) {
              const productNameLower = product.name.toLowerCase();
              const matchingKeywords = keywords.filter(kw => productNameLower.includes(kw));
              const threshold = Math.max(2, Math.floor(keywords.length * 0.5));

              if (matchingKeywords.length >= threshold) {
                productSlug = product.slug;
                console.log('Product found via keyword match:', productName, '-> keywords:', matchingKeywords, '-> slug:', productSlug);
                break;
              }
            }
          }
        }

        // 5. Auto-create product if not found
        if (!productSlug && productName) {
          productSlug = productName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

          console.log('No product match found, auto-creating product:', productName, '-> slug:', productSlug);

          const { error: createError } = await supabase
            .from('products')
            .insert({
              name: productName,
              slug: productSlug,
              type: 'curso',
              price: netValue || grossValue || 0,
              is_active: true,
              metadata: {
                source: 'hotmart_webhook',
                auto_created: true,
                hotmart_product_id: hotmartCode
              }
            });

          if (!createError) {
            console.log('Product auto-created successfully:', productName);
          } else if (createError.code === '23505') {
            console.log('Product already exists, using existing:', productSlug);
          } else {
            console.error('Error auto-creating product:', createError);
          }
        }

        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            lead_id: leadId,
            product_name: payload.data.product.name,
            product_code: String(payload.data.product.id),
            product_slug: productSlug,
            project_slug: projectSlug,
            status: normalizedStatus,
            value: netValue,
            gross_value: grossValue,
            commission: platformFee,
            currency: purchase.price?.currency_value || 'BRL',
            payment_method: purchase.payment?.type,
            installments: purchase.payment?.installments_number || 1,
            transaction_id: purchase.transaction,
            purchase_date: purchaseDate,
            platform: 'hotmart',
            source: payload.data.utm?.source || null,
            utm_source: payload.data.utm?.source,
            utm_campaign: payload.data.utm?.campaign,
            is_recurring: isSubscription,
            subscription_id: subscriptionId,
            metadata: { event: payload.event, version: payload.version }
          })
          .select('id')
          .single();

        if (purchaseError) {
          console.error('Error creating purchase:', purchaseError);
          throw new Error(`Error creating purchase: ${purchaseError.message}`);
        }

        console.log('Purchase created successfully:', purchaseData.id);
      }

      // Update lead CRM status based on purchase status
      if (normalizedStatus === 'approved') {
        await supabase
          .from('leads')
          .update({ crm_status: 'comprador', client_type: 'cliente' })
          .eq('lead_id', leadId);

        console.log('Lead CRM status updated to comprador');
      } else if (normalizedStatus === 'refunded') {
        // Optional: you could check if they have other active purchases
        // For now, let's keep them as cliente but maybe update the CRM tag
        await supabase
          .from('lead_events')
          .insert({
            lead_id: leadId,
            event_type: 'PURCHASE_REFUNDED_NOTIF',
            event_data: { transaction_id: purchase.transaction, amount: netValue },
            source: 'system'
          });
          
        console.log('Refund event registered for lead');
      }
    }

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
    console.error('Error processing Hotmart webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});