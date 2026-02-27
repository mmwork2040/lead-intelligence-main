-- Add gross_value column to purchases table
ALTER TABLE purchases ADD COLUMN gross_value numeric;

-- Update existing Hotmart purchases with estimated values
-- (Current value is gross, need to estimate net and fee)
UPDATE purchases
SET 
  gross_value = value,
  value = value * 0.90,
  commission = value * 0.10
WHERE platform = 'hotmart' AND gross_value IS NULL;