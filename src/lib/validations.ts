import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  slug: z
    .string()
    .min(3, "Slug deve ter no mínimo 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  type: z.enum(["curso", "mentoria", "ebook", "evento", "outro"], {
    required_error: "Tipo é obrigatório",
  }),
  description: z.string().optional(),
  price: z.number().min(0, "Preço deve ser maior ou igual a 0"),
  image_url: z.string().url("URL inválida").optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor inválida").optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  slug: z
    .string()
    .min(3, "Slug deve ter no mínimo 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor inválida"),
  products: z.array(z.string()).default([]),
  ad_spend: z.number().min(0, "Investimento deve ser maior ou igual a 0").optional(),
});

export const leadSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string()
    .min(10, "Telefone deve ter no mínimo 10 dígitos")
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .refine((val) => {
      const digits = val.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }, "Telefone inválido. Use formato: (11) 99999-9999 ou +55 11 99999-9999"),
  cpf: z.string().optional(),
  source: z.string().default("manual"),
  crm_status: z.string().default("new"),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  project_slug: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  // Campos de endereço
  zip_code: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido").optional().or(z.literal("")),
  street: z.string().optional(),
  street_number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().regex(/^[A-Z]{2}$/, "Estado deve ter 2 letras").optional().or(z.literal("")),
  country: z.string().optional(),
  region: z.string().optional(),
  // Campos demográficos
  gender: z.enum(["masculino", "feminino", "outro", "nao_informado"]).optional().or(z.literal("")),
  birth_date: z.string().refine((date) => {
    if (!date) return true;
    const birthDate = new Date(date);
    return birthDate < new Date();
  }, "Data de nascimento deve ser no passado").optional(),
});

export const importLeadSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  source: z.string().optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  project_slug: z.string().optional(),
  created_at: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const tagSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor inválida").optional(),
  description: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type CampaignFormData = z.infer<typeof campaignSchema>;
export type LeadFormData = z.infer<typeof leadSchema>;
export type ImportLeadFormData = z.infer<typeof importLeadSchema>;
export type TagFormData = z.infer<typeof tagSchema>;
