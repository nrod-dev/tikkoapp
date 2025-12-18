-- Add iva_amount column to tickets table
ALTER TABLE tickets 
ADD COLUMN iva_amount numeric(10, 2) DEFAULT NULL;

COMMENT ON COLUMN tickets.iva_amount IS 'Monto discriminado de IVA';
