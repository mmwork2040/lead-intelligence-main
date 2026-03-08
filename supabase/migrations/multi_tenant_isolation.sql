-- ============================================
-- MULTI-TENANT MIGRATION — Lead Intelligence
-- ============================================
-- INSTRUÇÕES:
-- 1. Faça backup do banco antes de rodar
-- 2. Execute este script PARTE POR PARTE no SQL Editor do Supabase
-- 3. Substitua 'SEU_USER_ID' pelo seu UUID real
-- ============================================

-- =============================================
-- PARTE 1: Adicionar coluna user_id em todas as tabelas
-- =============================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE tags ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE lead_tags ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE lead_merge_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE lead_versions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE invoice_requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE import_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE fb_ads_config ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE fb_campaigns ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE fb_adsets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE fb_ads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE fb_metrics ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE product_offers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- =============================================
-- PARTE 2: Descobrir seu user_id
-- Rode esta query e copie o UUID retornado:
-- =============================================

-- SELECT id, email FROM auth.users ORDER BY created_at LIMIT 5;

-- =============================================
-- PARTE 3: Atribuir dados existentes ao seu user_id
-- SUBSTITUA 'SEU_USER_ID' pelo UUID copiado acima
-- =============================================

-- UPDATE leads SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE campaigns SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE products SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE tags SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE purchases SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE lead_events SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE lead_tags SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE lead_merge_logs SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE lead_versions SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE invoice_requests SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE goals SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE import_logs SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE fb_ads_config SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE fb_campaigns SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE fb_adsets SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE fb_ads SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;
-- UPDATE fb_metrics SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;

-- =============================================
-- PARTE 4: Tornar user_id NOT NULL (APÓS migrar dados)
-- RODE SOMENTE DEPOIS da Parte 3
-- =============================================

-- ALTER TABLE leads ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE campaigns ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE products ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE tags ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE purchases ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE lead_events ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE lead_tags ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE lead_merge_logs ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE lead_versions ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE invoice_requests ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE import_logs ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE fb_ads_config ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE fb_campaigns ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE fb_adsets ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE fb_ads ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE fb_metrics ALTER COLUMN user_id SET NOT NULL;

-- =============================================
-- PARTE 5: Criar índices para performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_user_id ON lead_events(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- =============================================
-- PARTE 6: Habilitar RLS em todas as tabelas
-- =============================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_merge_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_ads_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_adsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_metrics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PARTE 7: Criar RLS Policies
-- =============================================

-- Helper function to create standard CRUD policies
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'leads', 'campaigns', 'products', 'tags', 'purchases',
    'lead_events', 'lead_tags', 'lead_merge_logs', 'lead_versions',
    'invoice_requests', 'goals', 'import_logs', 'fb_ads_config',
    'fb_campaigns', 'fb_adsets', 'fb_ads', 'fb_metrics'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Drop existing policies if any
    EXECUTE format('DROP POLICY IF EXISTS "Users can view own %1$s" ON %1$s', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %1$s" ON %1$s', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update own %1$s" ON %1$s', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %1$s" ON %1$s', tbl);

    -- Create CRUD policies
    EXECUTE format('CREATE POLICY "Users can view own %1$s" ON %1$s FOR SELECT USING (auth.uid() = user_id)', tbl);
    EXECUTE format('CREATE POLICY "Users can insert own %1$s" ON %1$s FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl);
    EXECUTE format('CREATE POLICY "Users can update own %1$s" ON %1$s FOR UPDATE USING (auth.uid() = user_id)', tbl);
    EXECUTE format('CREATE POLICY "Users can delete own %1$s" ON %1$s FOR DELETE USING (auth.uid() = user_id)', tbl);
  END LOOP;
END $$;

-- Policy especial para user_roles (tabela de controle de acesso)
-- Usuários podem ver sua própria role, admins podem gerenciar todas
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Service role para webhooks (bypass RLS)
-- Edge Functions com service_role key já bypassam RLS automaticamente
