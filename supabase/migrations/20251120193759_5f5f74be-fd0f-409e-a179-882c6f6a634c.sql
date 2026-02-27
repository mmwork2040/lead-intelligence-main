-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum for permissions
CREATE TYPE public.app_role AS ENUM ('admin', 'commercial', 'financial', 'support');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create leads table with unique ID system
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  project_slug TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create unique indexes for unification
CREATE UNIQUE INDEX idx_leads_phone ON public.leads(phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX idx_leads_email ON public.leads(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_leads_cpf ON public.leads(cpf) WHERE cpf IS NOT NULL;

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policies for leads
CREATE POLICY "Admins and commercial can view leads"
ON public.leads FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'commercial') OR
  public.has_role(auth.uid(), 'financial')
);

CREATE POLICY "Admins can insert leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create lead_events table for timeline
CREATE TABLE public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(lead_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

-- Policies for lead_events
CREATE POLICY "Users can view lead events"
ON public.lead_events FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'commercial') OR
  public.has_role(auth.uid(), 'financial')
);

-- Create purchases table
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(lead_id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_code TEXT,
  status TEXT NOT NULL,
  value DECIMAL(10,2),
  commission DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT,
  installments INTEGER DEFAULT 1,
  transaction_id TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  project_slug TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Policies for purchases
CREATE POLICY "Admins and financial can view purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'financial')
);

-- Create webhook_logs table
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  event_type TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  lead_id UUID REFERENCES public.leads(lead_id),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies for webhook_logs
CREATE POLICY "Admins can view webhook logs"
ON public.webhook_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  start_date DATE,
  end_date DATE,
  products TEXT[] DEFAULT ARRAY[]::TEXT[],
  pixel_code TEXT,
  ad_spend DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for campaigns
CREATE POLICY "All authenticated users can view campaigns"
ON public.campaigns FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage campaigns"
ON public.campaigns FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();