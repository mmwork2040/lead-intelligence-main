-- Adicionar campos de endereço e dados demográficos à tabela leads
ALTER TABLE public.leads
ADD COLUMN zip_code TEXT,
ADD COLUMN street TEXT,
ADD COLUMN street_number TEXT,
ADD COLUMN complement TEXT,
ADD COLUMN neighborhood TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN country TEXT DEFAULT 'Brasil',
ADD COLUMN region TEXT,
ADD COLUMN gender TEXT,
ADD COLUMN birth_date DATE;

-- Adicionar campo platform à tabela purchases
ALTER TABLE public.purchases
ADD COLUMN platform TEXT;

-- Migrar dados existentes: onde source = 'hotmart', definir platform = 'hotmart' e limpar source
UPDATE public.purchases
SET platform = 'hotmart', source = NULL
WHERE source = 'hotmart';

-- Criar índices para melhorar performance de consultas
CREATE INDEX idx_leads_city ON public.leads(city);
CREATE INDEX idx_leads_state ON public.leads(state);
CREATE INDEX idx_leads_region ON public.leads(region);
CREATE INDEX idx_purchases_platform ON public.purchases(platform);