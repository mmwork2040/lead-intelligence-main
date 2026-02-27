-- Create surveys table
CREATE TABLE public.surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  questions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(lead_id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on surveys
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- RLS policies for surveys
CREATE POLICY "Allow all operations on surveys for development"
ON public.surveys FOR ALL
USING (true)
WITH CHECK (true);

-- Enable RLS on survey_responses
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for survey_responses
CREATE POLICY "Allow all operations on survey_responses for development"
ON public.survey_responses FOR ALL
USING (true)
WITH CHECK (true);

-- Create updated_at trigger for surveys
CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_surveys_campaign_id ON public.surveys(campaign_id);
CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_lead_id ON public.survey_responses(lead_id);