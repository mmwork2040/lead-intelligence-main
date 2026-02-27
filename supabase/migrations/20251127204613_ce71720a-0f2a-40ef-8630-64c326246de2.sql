-- Remover política RESTRICTIVE atual que está bloqueando INSERTs
DROP POLICY IF EXISTS "Allow all operations for development on import_logs" ON import_logs;

-- Criar nova política PERMISSIVE para authenticated users
CREATE POLICY "Allow all operations for authenticated users on import_logs"
ON import_logs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Criar política PERMISSIVE para anon users (modo dev)
CREATE POLICY "Allow anon operations on import_logs"
ON import_logs
FOR ALL
TO anon
USING (true)
WITH CHECK (true);