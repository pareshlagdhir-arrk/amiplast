import { getPool } from '@/lib/db';

// Idempotent schema bootstrap. The Docker init scripts only run on a fresh
// volume; this self-heals databases that were created before later migrations
// existed. Safe to call on every request — every statement is IF NOT EXISTS /
// ON CONFLICT DO NOTHING.
let ensured: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

        CREATE TABLE IF NOT EXISTS stores (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          phone TEXT,
          email TEXT,
          type TEXT NOT NULL CHECK (type IN ('warehouse', 'showroom', 'outlet', 'other')),
          is_default BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT stores_default_warehouse_only CHECK (NOT is_default OR type = 'warehouse')
        );
        CREATE UNIQUE INDEX IF NOT EXISTS stores_single_default_idx
          ON stores (is_default) WHERE is_default;

        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS base_units (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sr_no INTEGER NOT NULL,
          sku TEXT,
          name TEXT NOT NULL,
          description TEXT,
          category_id TEXT REFERENCES categories(id),
          base_unit_id TEXT REFERENCES base_units(id),
          purchase_price NUMERIC(14, 2),
          retail_price NUMERIC(14, 2),
          wholesale_price NUMERIC(14, 2),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS products_name_idx ON products (lower(name));

        CREATE TABLE IF NOT EXISTS counters (
          key TEXT PRIMARY KEY,
          value INTEGER NOT NULL
        );
        INSERT INTO counters (key, value) VALUES ('product_sr_no', 1)
          ON CONFLICT (key) DO NOTHING;

        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT settings_singleton CHECK (id = 1)
        );
      `);
    })();
  }
  return ensured;
}
