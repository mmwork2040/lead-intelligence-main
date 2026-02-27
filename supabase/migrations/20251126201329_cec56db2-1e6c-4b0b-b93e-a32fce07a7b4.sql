-- Políticas de desenvolvimento para import_logs
CREATE POLICY "Allow insert for development"
ON public.import_logs
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow update for development"
ON public.import_logs
FOR UPDATE
TO anon
USING (true);

-- Políticas de desenvolvimento para products
CREATE POLICY "Allow insert products for development"
ON public.products
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow update products for development"
ON public.products
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow delete products for development"
ON public.products
FOR DELETE
TO anon
USING (true);

-- Políticas de desenvolvimento para leads
CREATE POLICY "Allow insert leads for development"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow update leads for development"
ON public.leads
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow delete leads for development"
ON public.leads
FOR DELETE
TO anon
USING (true);

-- Políticas de desenvolvimento para tags
CREATE POLICY "Allow insert tags for development"
ON public.tags
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow update tags for development"
ON public.tags
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow delete tags for development"
ON public.tags
FOR DELETE
TO anon
USING (true);

-- Políticas de desenvolvimento para lead_tags
CREATE POLICY "Allow insert lead_tags for development"
ON public.lead_tags
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow update lead_tags for development"
ON public.lead_tags
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow delete lead_tags for development"
ON public.lead_tags
FOR DELETE
TO anon
USING (true);

-- Políticas de desenvolvimento para lead_events
CREATE POLICY "Allow insert lead_events for development"
ON public.lead_events
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow update lead_events for development"
ON public.lead_events
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow delete lead_events for development"
ON public.lead_events
FOR DELETE
TO anon
USING (true);