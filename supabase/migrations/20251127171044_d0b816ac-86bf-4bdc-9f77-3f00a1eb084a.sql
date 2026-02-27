-- Adicionar campos de recorrência na tabela purchases
ALTER TABLE public.purchases
ADD COLUMN is_recurring boolean DEFAULT false,
ADD COLUMN subscription_id text;

COMMENT ON COLUMN public.purchases.is_recurring IS 'Indica se é uma venda recorrente/assinatura (não confundir com parcelamento)';
COMMENT ON COLUMN public.purchases.subscription_id IS 'ID da assinatura fornecido pela plataforma de pagamento';

-- Criar índice para melhorar performance em queries de recorrência
CREATE INDEX idx_purchases_is_recurring ON public.purchases(is_recurring) WHERE is_recurring = true;