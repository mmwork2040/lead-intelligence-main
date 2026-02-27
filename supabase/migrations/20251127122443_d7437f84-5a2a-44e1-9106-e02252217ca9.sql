-- Create goals table for tracking targets and objectives
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('leads', 'sales', 'revenue')),
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  product_slug TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for goals
CREATE POLICY "Allow all operations on goals for development"
ON public.goals FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can manage all goals"
ON public.goals FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view goals"
ON public.goals FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger for goals
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_goals_period ON public.goals(start_date, end_date);
CREATE INDEX idx_goals_campaign_id ON public.goals(campaign_id);
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_goals_metric_type ON public.goals(metric_type);