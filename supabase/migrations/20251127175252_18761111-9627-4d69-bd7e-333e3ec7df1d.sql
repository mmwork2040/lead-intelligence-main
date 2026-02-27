-- Criar bucket público para imagens de produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- RLS: Permitir leitura pública
CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- RLS: Apenas autenticados podem fazer upload
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- RLS: Apenas autenticados podem deletar suas imagens
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Criar tabela de ofertas Hotmart
CREATE TABLE public.product_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  hotmart_code TEXT NOT NULL UNIQUE,
  offer_name TEXT NOT NULL,
  offer_price NUMERIC DEFAULT 0,
  offer_type TEXT DEFAULT 'venda',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index para busca rápida por código Hotmart
CREATE INDEX idx_product_offers_hotmart_code ON product_offers(hotmart_code);

-- RLS policies
ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view offers"
ON product_offers FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage offers"
ON product_offers FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE TRIGGER update_product_offers_updated_at
  BEFORE UPDATE ON product_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();