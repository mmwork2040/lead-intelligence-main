-- Tabela de produtos
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  type text NOT NULL, -- 'curso', 'mentoria', 'ebook', 'evento', 'outro'
  image_url text,
  price numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver produtos ativos
CREATE POLICY "Authenticated users can view active products"
ON public.products FOR SELECT
USING (is_active = true);

-- Admins podem gerenciar todos os produtos
CREATE POLICY "Admins can manage all products"
ON public.products FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger de updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_is_active ON public.products(is_active);

-- Adicionar campo product_slug em purchases
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS product_slug text;
CREATE INDEX IF NOT EXISTS idx_purchases_product_slug ON public.purchases(product_slug);

-- Adicionar índice em project_slug para leads (performance)
CREATE INDEX IF NOT EXISTS idx_leads_project_slug ON public.leads(project_slug);