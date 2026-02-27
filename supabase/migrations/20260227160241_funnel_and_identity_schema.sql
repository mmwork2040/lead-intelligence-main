-- =========================================================================
-- FUNNEL & IDENTITY RESOLUTION MODULE
-- =========================================================================

-- 1. Tabela de Visitantes Anônimos (Visitor Profiles)
-- Mantém o rastro do usuário anônimo antes de ele se tornar um lead.
CREATE TABLE public.visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_uuid TEXT NOT NULL UNIQUE, -- Gerado no front-end por cookie/localStorage
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  lead_id UUID DEFAULT NULL REFERENCES public.leads(id) ON DELETE SET NULL, -- Se torna NOT NULL quando há o Merge de Identidade
  merged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index para buscas rápidas no endpoint de tracking
CREATE INDEX idx_visitors_uuid ON public.visitors(visitor_uuid);
CREATE INDEX idx_visitors_lead_id ON public.visitors(lead_id);

-- 2. Tabela de Funis (Funnels)
-- Permite agrupar etapas em um fluxo lógico (ex: Funil de Lançamento, Funil Perpétuo)
CREATE TABLE public.funnels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_slug TEXT, -- Vincula ao projeto/workspace atual
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Etapas do Funil (Funnel Steps)
-- Ex: 1- Landing Page, 2- Quiz, 3- Checkout, 4- Obrigado
CREATE TABLE public.funnel_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL, -- 1, 2, 3...
  name TEXT NOT NULL,
  url_pattern TEXT, -- Regra para match via URL (ex: "*/checkout/*")
  event_name TEXT, -- Regra para match manual via evento do tracking script
  is_conversion_point BOOLEAN DEFAULT false, -- Define se marca como "venda" ou "lead gerado"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_funnel_steps_funnel_id ON public.funnel_steps(funnel_id);

-- 4. Tabela de Eventos de Tracking (Tracking Events)
-- Registra cada PageView ou Ação, consolidando UTMs, Visitante e a Etapa correspondente.
CREATE TABLE public.tracking_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE, -- Preenchido automaticamente via Trigger/Job de Merge
  funnel_step_id UUID REFERENCES public.funnel_steps(id) ON DELETE SET NULL,
  
  event_type TEXT NOT NULL, -- 'page_view', 'form_submit', 'checkout_initiated'
  page_url TEXT NOT NULL,
  referrer_url TEXT,
  
  -- Tracking & UTMs originais do clique
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Para enriquecimento na CAPI
  user_agent TEXT,
  ip_address TEXT,
  fbp TEXT, -- FB Browser ID
  fbc TEXT, -- FB Click ID
  
  metadata JSONB, -- Dados extras (ex: respostas do quiz)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_tracking_events_visitor ON public.tracking_events(visitor_id);
CREATE INDEX idx_tracking_events_lead ON public.tracking_events(lead_id);
CREATE INDEX idx_tracking_events_step ON public.tracking_events(funnel_step_id);
