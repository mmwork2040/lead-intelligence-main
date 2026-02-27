-- Adicionar políticas RLS para permitir INSERT, UPDATE, DELETE em purchases
-- Remover políticas restritivas e adicionar permissivas para desenvolvimento

-- Política para permitir INSERT de compras
CREATE POLICY "Allow insert purchases for development"
ON public.purchases
FOR INSERT
WITH CHECK (true);

-- Política para permitir UPDATE de compras
CREATE POLICY "Allow update purchases for development"
ON public.purchases
FOR UPDATE
USING (true);

-- Política para permitir DELETE de compras
CREATE POLICY "Allow delete purchases for development"
ON public.purchases
FOR DELETE
USING (true);