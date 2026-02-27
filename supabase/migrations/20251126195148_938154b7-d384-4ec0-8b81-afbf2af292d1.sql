-- Tabela de tags do sistema
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280',
  description TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Relacionamento leads <-> tags (many-to-many)
CREATE TABLE lead_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'manual',
  UNIQUE(lead_id, tag_id)
);

-- Tabela para histórico de importações
CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  total_rows INTEGER DEFAULT 0,
  imported_rows INTEGER DEFAULT 0,
  duplicates_found INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  tags_created TEXT[] DEFAULT '{}',
  column_mapping JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  error_details JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX idx_lead_tags_lead ON lead_tags(lead_id);
CREATE INDEX idx_lead_tags_tag ON lead_tags(tag_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_import_logs_status ON import_logs(status);

-- RLS Policies para tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags"
  ON tags FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'commercial'::app_role) OR 
    has_role(auth.uid(), 'financial'::app_role)
  );

CREATE POLICY "Admins can manage tags"
  ON tags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para lead_tags
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead tags"
  ON lead_tags FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'commercial'::app_role) OR 
    has_role(auth.uid(), 'financial'::app_role)
  );

CREATE POLICY "Admins can manage lead tags"
  ON lead_tags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para import_logs
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view import logs"
  ON import_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage import logs"
  ON import_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));