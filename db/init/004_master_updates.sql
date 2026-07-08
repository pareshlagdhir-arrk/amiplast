-- Store: add email
ALTER TABLE stores ADD COLUMN IF NOT EXISTS email TEXT;

-- Products: relax requirements for quick multi-add.
-- SKU and base unit become optional (left blank), category optional,
-- and SKU is no longer a unique identifier.
ALTER TABLE products ALTER COLUMN sku DROP NOT NULL;
ALTER TABLE products ALTER COLUMN base_unit_id DROP NOT NULL;
ALTER TABLE products ALTER COLUMN category_id DROP NOT NULL;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;

-- Support name filter/sort at the database side.
CREATE INDEX IF NOT EXISTS products_name_idx ON products (lower(name));

-- Persisted application settings (single JSON row).
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);

INSERT INTO settings (id, data) VALUES (1, '{
  "app": {"appTitle":"Amiplast","currency":"MGA","position":"suffix","numberFormat":"fr","salesInvoiceStart":"1","purchaseInvoiceStart":"1","defaultMargin":"30"},
  "company": {"name":"","address":"","city":"","country":"","email":"","phone":""}
}'::jsonb)
ON CONFLICT (id) DO NOTHING;
