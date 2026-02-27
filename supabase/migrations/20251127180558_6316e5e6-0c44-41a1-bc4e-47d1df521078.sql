-- Criar função trigger para criar invoice_request automaticamente em compras aprovadas
CREATE OR REPLACE FUNCTION create_invoice_request_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Só cria se status for approved e não existir invoice_request
  IF NEW.status = 'approved' THEN
    -- Verificar se já existe invoice_request para esta compra
    IF NOT EXISTS (SELECT 1 FROM invoice_requests WHERE purchase_id = NEW.id) THEN
      INSERT INTO invoice_requests (
        lead_id,
        purchase_id,
        lead_name,
        lead_email,
        lead_cpf,
        lead_phone,
        value,
        description,
        status
      )
      SELECT 
        NEW.lead_id,
        NEW.id,
        l.name,
        l.email,
        l.cpf,
        l.phone,
        NEW.value,
        NEW.product_name,
        'pending'
      FROM leads l
      WHERE l.lead_id = NEW.lead_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
CREATE TRIGGER trigger_create_invoice_on_purchase
AFTER INSERT OR UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION create_invoice_request_on_purchase();

-- Criar invoice_requests para compras aprovadas existentes que não possuem
INSERT INTO invoice_requests (lead_id, purchase_id, lead_name, lead_email, lead_cpf, lead_phone, value, description, status)
SELECT 
  p.lead_id,
  p.id,
  l.name,
  l.email,
  l.cpf,
  l.phone,
  p.value,
  p.product_name,
  'pending'
FROM purchases p
JOIN leads l ON p.lead_id = l.lead_id
WHERE p.status = 'approved'
AND NOT EXISTS (SELECT 1 FROM invoice_requests ir WHERE ir.purchase_id = p.id);