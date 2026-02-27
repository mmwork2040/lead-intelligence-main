-- Corrigir search_path das funções de normalização
CREATE OR REPLACE FUNCTION public.normalize_phone(phone_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF phone_input IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_email(email_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF email_input IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN lower(trim(email_input));
END;
$$;