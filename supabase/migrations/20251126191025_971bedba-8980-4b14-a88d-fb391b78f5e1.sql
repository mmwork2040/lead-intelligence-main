-- Tabela de logs de unificação de leads
CREATE TABLE public.lead_merge_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_lead_id uuid NOT NULL REFERENCES public.leads(lead_id) ON DELETE CASCADE,
  merged_lead_id uuid NOT NULL,
  merge_reason text NOT NULL, -- 'phone', 'email', 'cpf', 'name_phone_partial'
  merged_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  conflict_fields text[] DEFAULT ARRAY[]::text[],
  reviewed boolean DEFAULT false,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_lead_merge_logs_master ON public.lead_merge_logs(master_lead_id);
CREATE INDEX idx_lead_merge_logs_merged ON public.lead_merge_logs(merged_lead_id);
CREATE INDEX idx_lead_merge_logs_reviewed ON public.lead_merge_logs(reviewed);

-- RLS Policies
ALTER TABLE public.lead_merge_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view merge logs"
ON public.lead_merge_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage merge logs"
ON public.lead_merge_logs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Função para normalizar telefone (remove caracteres especiais)
CREATE OR REPLACE FUNCTION public.normalize_phone(phone_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF phone_input IS NULL THEN
    RETURN NULL;
  END IF;
  -- Remove tudo exceto números
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$;

-- Função para normalizar email (lowercase, trim)
CREATE OR REPLACE FUNCTION public.normalize_email(email_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF email_input IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN lower(trim(email_input));
END;
$$;