-- =====================================================
-- CORRIGIR RLS PARA TABELA CAMPAIGNS
-- =====================================================

-- Criar política PERMISSIVA para INSERT em campanhas (desenvolvimento)
CREATE POLICY "Allow insert campaigns for development" 
ON public.campaigns 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Criar política PERMISSIVA para UPDATE em campanhas (desenvolvimento)
CREATE POLICY "Allow update campaigns for development" 
ON public.campaigns 
FOR UPDATE 
TO anon, authenticated 
USING (true);

-- Criar política PERMISSIVA para DELETE em campanhas (desenvolvimento)
CREATE POLICY "Allow delete campaigns for development" 
ON public.campaigns 
FOR DELETE 
TO anon, authenticated 
USING (true);

-- =====================================================
-- CORRIGIR RLS PARA TABELA LEADS
-- =====================================================

-- Remover política RESTRICTIVA existente
DROP POLICY IF EXISTS "Allow all insert leads for development" ON public.leads;

-- Recriar como PERMISSIVA (padrão do PostgreSQL)
CREATE POLICY "Allow insert leads for development" 
ON public.leads 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Garantir SELECT também funciona para desenvolvimento
DROP POLICY IF EXISTS "Admins and commercial can view leads" ON public.leads;

CREATE POLICY "Allow select leads for development" 
ON public.leads 
FOR SELECT 
TO anon, authenticated 
USING (true);