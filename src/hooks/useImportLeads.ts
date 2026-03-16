import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentUserId } from "@/lib/getCurrentUserId";
import type { Database } from "@/integrations/supabase/types";
import { getRegionByState } from "@/lib/cep";
import { slugify } from "@/lib/utils/slugify";
import { normalizePhoneForWhatsApp } from "@/lib/utils";

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];

export type ImportConfig = {
  mapping: Record<string, string | null>;
  useOriginalDate: boolean;
  selectedTags: string[];
  newTags: string[];
  tagColumns: string[];
  defaultCrmStatus: string;
  campaignSlug?: string;
};

export type ImportResult = {
  imported: number;
  duplicates: number;
  errors: number;
  errorDetails: any[];
  tagsCreated: string[];
  productsCreated: string[];
};

export const useImportLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      config,
      filename,
    }: {
      data: Record<string, any>[];
      config: ImportConfig;
      filename: string;
    }): Promise<ImportResult> => {
      const result: ImportResult = {
        imported: 0,
        duplicates: 0,
        errors: 0,
        errorDetails: [],
        tagsCreated: [],
        productsCreated: [],
      };

      // Cache de produtos para evitar múltiplas consultas
      const productCache: Record<string, string> = {}; // product_name -> product_slug

      const user_id = await getCurrentUserId();

      // Criar log de importação
      const { data: importLog, error: logError } = await supabase
        .from("import_logs")
        .insert({
          filename,
          total_rows: data.length,
          column_mapping: config.mapping,
          status: "processing",
          user_id,
        } as any)
        .select()
        .single();

      if (logError) throw logError;

      // Criar tags novas se necessário
      const existingTags = await supabase.from("tags").select("*");
      const existingTagNames = new Set(
        existingTags.data?.map((t) => t.name.toLowerCase()) || []
      );

      const allTags = [...config.selectedTags, ...config.newTags];
      const tagsToCreate = allTags.filter(
        (tag) => !existingTagNames.has(tag.toLowerCase())
      );

      const createdTagIds: Record<string, string> = {};

      for (const tagName of tagsToCreate) {
        const { data: newTag, error } = await supabase
          .from("tags")
          .insert({ name: tagName, source: "import", user_id })
          .select()
          .single();

        if (!error && newTag) {
          createdTagIds[tagName.toLowerCase()] = newTag.id;
          result.tagsCreated.push(tagName);
        }
      }

      // Buscar IDs das tags existentes
      const { data: allTagsData } = await supabase.from("tags").select("*");
      const tagNameToId: Record<string, string> = {};
      allTagsData?.forEach((tag) => {
        tagNameToId[tag.name.toLowerCase()] = tag.id;
      });

      // Processar leads em batches
      const BATCH_SIZE = 100;
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);

        for (const row of batch) {
          try {
            // Mapear dados do lead
            const leadData: LeadInsert = {};
            const purchaseData: any = {};
            let hasPurchaseData = false;

            // Variável temporária para DDD
            let dddValue: string | null = null;

            Object.entries(config.mapping).forEach(([fileColumn, dbField]) => {
              if (!dbField || !row[fileColumn]) return;

              const value = row[fileColumn];

              // Capturar DDD separadamente
              if (dbField === "ddd") {
                dddValue = value.toString().replace(/\D/g, '');
                return;
              }

              // Campos de compra
              if (dbField.startsWith("purchase_")) {
                hasPurchaseData = true;
                const purchaseField = dbField.replace("purchase_", "");

                if (purchaseField === "value") {
                  purchaseData[purchaseField] = parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
                } else if (purchaseField === "date") {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    purchaseData.purchase_date = date.toISOString();
                  }
                } else if (purchaseField === "product") {
                  purchaseData.product_name = value;
                } else if (purchaseField === "payment_method") {
                  purchaseData.payment_method = value;
                } else if (purchaseField === "status") {
                  purchaseData.status = value;
                }
                return;
              }

              // Campos de data
              if (dbField === "created_at" && config.useOriginalDate) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  (leadData as any)[dbField] = date.toISOString();
                }
              } else if (dbField === "birth_date") {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  (leadData as any)[dbField] = date.toISOString().split('T')[0];
                }
              } else if (dbField !== "tags") {
                (leadData as any)[dbField] = value;
              }
            });

            // Unificar DDD + Telefone
            if (dddValue && leadData.phone) {
              const cleanPhone = leadData.phone.toString().replace(/\D/g, '');
              // Se telefone não começa com DDD, adicionar
              if (!cleanPhone.startsWith(dddValue)) {
                leadData.phone = dddValue + cleanPhone;
              }
            }

            // Normalizar telefone para formato internacional com DDI
            if (leadData.phone) {
              leadData.phone = normalizePhoneForWhatsApp(leadData.phone.toString());
            }

            // Auto-preencher região baseado no estado
            if (leadData.state && !leadData.region) {
              leadData.region = getRegionByState(leadData.state as string);
            }

            // Apply default CRM status if not mapped
            if (!leadData.crm_status) {
              leadData.crm_status = config.defaultCrmStatus;
            }

            // Apply campaign slug if provided in config
            if (config.campaignSlug && !leadData.project_slug) {
              leadData.project_slug = config.campaignSlug;
            }

            // Validar dados mínimos
            if (!leadData.email && !leadData.phone) {
              result.errors++;
              result.errorDetails.push({
                row: row,
                error: "Email ou telefone obrigatório",
              });
              continue;
            }

            // Verificar duplicata usando unificação
            let leadId: string | null = null;

            // Normalizar dados para comparação
            const normalizedPhone = leadData.phone?.toString().replace(/[^0-9]/g, '') || null;
            const normalizedEmail = leadData.email?.toString().toLowerCase().trim() || null;

            if (normalizedPhone || normalizedEmail) {
              // Construir condições OR apenas para campos preenchidos
              const conditions: string[] = [];

              if (normalizedPhone && normalizedPhone.length >= 10) {
                conditions.push(`phone.ilike.%${normalizedPhone}%`);
              }

              if (normalizedEmail) {
                conditions.push(`email.ilike.${normalizedEmail}`);
              }

              if (conditions.length > 0) {
                const { data: existingLeads } = await supabase
                  .from("leads")
                  .select("lead_id")
                  .or(conditions.join(','))
                  .limit(1);

                if (existingLeads && existingLeads.length > 0) {
                  leadId = existingLeads[0].lead_id;
                  result.duplicates++;

                  // Atualizar campos vazios do lead existente
                  await supabase
                    .from("leads")
                    .update(leadData)
                    .eq("lead_id", leadId);
                }
              }
            }

            // Criar novo lead se não for duplicata
            if (!leadId) {
              const { data: newLead, error: leadError } = await supabase
                .from("leads")
                .insert({ ...leadData, user_id })
                .select()
                .single();

              if (leadError) throw leadError;

              leadId = newLead.lead_id;
              result.imported++;

              // Criar evento de importação
              await supabase.from("lead_events").insert({
                lead_id: leadId,
                event_type: "lead_imported",
                source: "import",
                event_data: { filename },
                user_id,
              });
            }

            // Criar compra se houver dados de compra
            if (hasPurchaseData && leadId && purchaseData.product_name) {
              purchaseData.lead_id = leadId;
              purchaseData.platform = "import";
              purchaseData.source = leadData.source || "import";

              // Valores padrão
              if (!purchaseData.status) {
                purchaseData.status = "approved";
              }
              if (!purchaseData.purchase_date) {
                purchaseData.purchase_date = new Date().toISOString();
              }

              // CRIAR PRODUTO AUTOMATICAMENTE SE NÃO EXISTIR
              const productNameLower = purchaseData.product_name.toLowerCase().trim();

              if (!productCache[productNameLower]) {
                // Verificar se produto já existe
                const { data: existingProduct } = await supabase
                  .from("products")
                  .select("id, slug")
                  .ilike("name", purchaseData.product_name)
                  .maybeSingle();

                if (existingProduct) {
                  productCache[productNameLower] = existingProduct.slug;
                } else {
                  // Criar produto automaticamente
                  const baseSlug = slugify(purchaseData.product_name);

                  // Verificar se slug já existe
                  const { data: slugExists } = await supabase
                    .from("products")
                    .select("id")
                    .eq("slug", baseSlug)
                    .maybeSingle();

                  const newSlug = slugExists ? `${baseSlug}-${Date.now()}` : baseSlug;

                  const { data: newProduct, error: productError } = await supabase
                    .from("products")
                    .insert({
                      name: purchaseData.product_name,
                      slug: newSlug,
                      type: "curso",
                      price: purchaseData.value || 0,
                      is_active: true,
                      metadata: { source: "import", auto_created: true },
                      user_id,
                    } as any)
                    .select()
                    .single();

                  if (!productError && newProduct) {
                    productCache[productNameLower] = newProduct.slug;
                    result.productsCreated.push(purchaseData.product_name);
                  }
                }
              }

              // Definir product_slug na compra
              if (productCache[productNameLower]) {
                purchaseData.product_slug = productCache[productNameLower];
              }

              const { error: purchaseError } = await supabase
                .from("purchases")
                .insert({ ...purchaseData, user_id });

              if (purchaseError) {
                console.error("Error creating purchase:", purchaseError);
              } else {
                // Atualizar status CRM para comprador
                await supabase
                  .from("leads")
                  .update({ crm_status: "comprador" })
                  .eq("lead_id", leadId);

                // Criar evento de compra
                await supabase.from("lead_events").insert({
                  lead_id: leadId,
                  event_type: "purchase_created",
                  source: "import",
                  event_data: {
                    product: purchaseData.product_name,
                    value: purchaseData.value,
                    product_slug: purchaseData.product_slug,
                  },
                  user_id,
                });
              }
            }

            // Adicionar tags ao lead
            const leadTags: string[] = [];

            // Tags da configuração
            leadTags.push(...allTags);

            // Tags extraídas das colunas
            config.tagColumns.forEach((col) => {
              const value = row[col];
              if (value) {
                const tags = String(value)
                  .split(/[,;|\/]/)
                  .map((t) => t.trim())
                  .filter((t) => t);
                leadTags.push(...tags);
              }
            });

            // Remover duplicatas
            const uniqueTags = [...new Set(leadTags.map((t) => t.toLowerCase()))];

            // Adicionar tags ao lead (usar upsert para evitar duplicatas)
            for (const tagName of uniqueTags) {
              const tagId = tagNameToId[tagName];
              if (tagId && leadId) {
                await supabase.from("lead_tags").upsert(
                  {
                    lead_id: leadId,
                    tag_id: tagId,
                    source: "import",
                  },
                  {
                    onConflict: 'lead_id,tag_id',
                    ignoreDuplicates: true
                  }
                );
              }
            }
          } catch (error: any) {
            result.errors++;
            result.errorDetails.push({ row, error: error.message });
          }
        }
      }

      // Atualizar log de importação
      await supabase
        .from("import_logs")
        .update({
          imported_rows: result.imported,
          duplicates_found: result.duplicates,
          errors: result.errors,
          tags_created: result.tagsCreated,
          error_details: result.errorDetails,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", importLog.id);

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["unlinked-purchases"] });

      let message = `Importação concluída! ${result.imported} leads importados, ${result.duplicates} duplicatas atualizadas.`;

      if (result.productsCreated.length > 0) {
        message += ` ${result.productsCreated.length} produtos criados.`;
      }

      toast.success(message);

      if (result.errors > 0) {
        toast.error(`${result.errors} erros encontrados durante a importação.`);
      }
    },
    onError: (error: Error) => {
      console.error("Error importing leads:", error);
      toast.error(error.message || "Erro ao importar leads");
    },
  });
};
