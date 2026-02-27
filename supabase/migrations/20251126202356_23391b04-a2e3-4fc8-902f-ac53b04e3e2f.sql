-- Remover políticas restritivas de import_logs e adicionar políticas permissivas para desenvolvimento
DROP POLICY IF EXISTS "Admins can manage import logs" ON public.import_logs;
DROP POLICY IF EXISTS "Admins can view import logs" ON public.import_logs;
DROP POLICY IF EXISTS "Allow insert for development" ON public.import_logs;
DROP POLICY IF EXISTS "Allow update for development" ON public.import_logs;

-- Criar novas políticas permissivas para anon users (modo desenvolvimento)
CREATE POLICY "Allow all operations for development on import_logs"
ON public.import_logs
FOR ALL
TO anon
USING (true)
WITH CHECK (true);