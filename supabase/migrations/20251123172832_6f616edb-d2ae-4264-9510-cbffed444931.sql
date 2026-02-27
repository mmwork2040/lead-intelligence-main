-- Criar tabela de configuração do sistema para controlar modo desenvolvimento
CREATE TABLE IF NOT EXISTS public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Políticas abertas para leitura (qualquer um pode ler config)
CREATE POLICY "Allow read system config"
ON public.system_config
FOR SELECT
TO authenticated, anon
USING (true);

-- Apenas admins podem modificar (preparado para produção)
CREATE POLICY "Allow admin update system config"
ON public.system_config
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Inserir configuração inicial de modo desenvolvimento
INSERT INTO public.system_config (key, value) 
VALUES ('dev_mode', '{"enabled": true, "bypass_auth": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Trigger para updated_at
CREATE TRIGGER update_system_config_updated_at
BEFORE UPDATE ON public.system_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();