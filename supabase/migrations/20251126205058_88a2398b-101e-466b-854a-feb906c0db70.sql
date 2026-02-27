-- Fix RLS policies for lead import
DROP POLICY IF EXISTS "Admins can insert leads" ON leads;
DROP POLICY IF EXISTS "Allow insert leads for development" ON leads;
DROP POLICY IF EXISTS "Allow insert tags for development" ON tags;

CREATE POLICY "Allow all insert leads for development" 
ON leads FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow all insert tags for development" 
ON tags FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Create invoice_requests table
CREATE TABLE IF NOT EXISTS public.invoice_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(lead_id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'issued')),
  value NUMERIC NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  lead_name TEXT,
  lead_email TEXT,
  lead_cpf TEXT,
  lead_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  issued_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.invoice_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_requests
CREATE POLICY "Admins and financial can view invoice requests"
ON public.invoice_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financial'));

CREATE POLICY "Admins can manage invoice requests"
ON public.invoice_requests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow all invoice_requests for development"
ON public.invoice_requests FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_invoice_requests_lead_id ON public.invoice_requests(lead_id);
CREATE INDEX idx_invoice_requests_status ON public.invoice_requests(status);