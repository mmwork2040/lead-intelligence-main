-- Create Facebook Ads configuration table
CREATE TABLE IF NOT EXISTS public.fb_ads_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token text NOT NULL,
  ad_account_id text NOT NULL,
  is_active boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create Facebook Ads campaigns table
CREATE TABLE IF NOT EXISTS public.fb_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fb_campaign_id text NOT NULL UNIQUE,
  name text NOT NULL,
  status text,
  objective text,
  daily_budget numeric,
  lifetime_budget numeric,
  start_time timestamp with time zone,
  stop_time timestamp with time zone,
  created_time timestamp with time zone,
  updated_time timestamp with time zone,
  campaign_slug text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create Facebook Ads adsets table
CREATE TABLE IF NOT EXISTS public.fb_adsets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fb_adset_id text NOT NULL UNIQUE,
  fb_campaign_id text NOT NULL,
  name text NOT NULL,
  status text,
  daily_budget numeric,
  lifetime_budget numeric,
  optimization_goal text,
  billing_event text,
  bid_amount numeric,
  targeting jsonb DEFAULT '{}'::jsonb,
  created_time timestamp with time zone,
  updated_time timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create Facebook Ads ads table
CREATE TABLE IF NOT EXISTS public.fb_ads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fb_ad_id text NOT NULL UNIQUE,
  fb_adset_id text NOT NULL,
  fb_campaign_id text NOT NULL,
  name text NOT NULL,
  status text,
  creative_id text,
  creative_name text,
  creative_preview_url text,
  created_time timestamp with time zone,
  updated_time timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create Facebook Ads metrics table
CREATE TABLE IF NOT EXISTS public.fb_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fb_campaign_id text,
  fb_adset_id text,
  fb_ad_id text,
  date_start date NOT NULL,
  date_stop date NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  spend numeric DEFAULT 0,
  reach integer DEFAULT 0,
  frequency numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  cpm numeric DEFAULT 0,
  ctr numeric DEFAULT 0,
  conversions integer DEFAULT 0,
  cost_per_conversion numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(fb_campaign_id, fb_adset_id, fb_ad_id, date_start, date_stop)
);

-- Enable RLS
ALTER TABLE public.fb_ads_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_adsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for fb_ads_config
CREATE POLICY "Admins can manage FB Ads config"
  ON public.fb_ads_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for fb_campaigns
CREATE POLICY "Admins can view FB campaigns"
  ON public.fb_campaigns
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'commercial'::app_role));

CREATE POLICY "Admins can manage FB campaigns"
  ON public.fb_campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for fb_adsets
CREATE POLICY "Admins and commercial can view FB adsets"
  ON public.fb_adsets
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'commercial'::app_role));

CREATE POLICY "Admins can manage FB adsets"
  ON public.fb_adsets
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for fb_ads
CREATE POLICY "Admins and commercial can view FB ads"
  ON public.fb_ads
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'commercial'::app_role));

CREATE POLICY "Admins can manage FB ads"
  ON public.fb_ads
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for fb_metrics
CREATE POLICY "Admins and commercial can view FB metrics"
  ON public.fb_metrics
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'commercial'::app_role));

CREATE POLICY "Admins can manage FB metrics"
  ON public.fb_metrics
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_fb_ads_config_updated_at
  BEFORE UPDATE ON public.fb_ads_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fb_campaigns_updated_at
  BEFORE UPDATE ON public.fb_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fb_adsets_updated_at
  BEFORE UPDATE ON public.fb_adsets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fb_ads_updated_at
  BEFORE UPDATE ON public.fb_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fb_metrics_updated_at
  BEFORE UPDATE ON public.fb_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_fb_campaigns_fb_id ON public.fb_campaigns(fb_campaign_id);
CREATE INDEX idx_fb_campaigns_slug ON public.fb_campaigns(campaign_slug);
CREATE INDEX idx_fb_adsets_fb_id ON public.fb_adsets(fb_adset_id);
CREATE INDEX idx_fb_adsets_campaign ON public.fb_adsets(fb_campaign_id);
CREATE INDEX idx_fb_ads_fb_id ON public.fb_ads(fb_ad_id);
CREATE INDEX idx_fb_ads_adset ON public.fb_ads(fb_adset_id);
CREATE INDEX idx_fb_ads_campaign ON public.fb_ads(fb_campaign_id);
CREATE INDEX idx_fb_metrics_campaign ON public.fb_metrics(fb_campaign_id);
CREATE INDEX idx_fb_metrics_adset ON public.fb_metrics(fb_adset_id);
CREATE INDEX idx_fb_metrics_ad ON public.fb_metrics(fb_ad_id);
CREATE INDEX idx_fb_metrics_date ON public.fb_metrics(date_start, date_stop);