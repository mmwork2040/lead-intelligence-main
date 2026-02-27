-- Add CRM status field to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS crm_status text DEFAULT 'new';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_leads_crm_status ON public.leads(crm_status);

-- Add comment
COMMENT ON COLUMN public.leads.crm_status IS 'CRM pipeline status: new, contacted, qualified, proposal, negotiation, won, lost';