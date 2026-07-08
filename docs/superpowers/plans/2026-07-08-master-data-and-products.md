# Master Data and Products Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persisted Stores, Categories, Base Units, and Products management to the Amiplast dashboard, each with full list/create/edit/delete, reachable from a new Master header menu (three masters) and a separate Products link.

**Architecture:** Client components under `app/dashboard/*` call REST API routes under `app/api/master/*`, which use `getPool()` from `lib/db.ts` against Postgres. This mirrors the existing `app/api/auth/*` pattern. Categories and Base Units share a single generic handler factory and a shared page component because they have identical shape.

**Tech Stack:** Next.js 16 (App Router, async route params), React 19, TypeScript, `pg`, Tailwind (Tokyo Night palette, JetBrains Mono), existing `components/ui` primitives.

## Global Constraints

- No test runner exists in this repo. Verification for every task is: `npm run typecheck` (must pass), `npm run lint` (must pass), plus the runtime checks written into that task. Do not add a test framework.
- Every text field defaults to an empty string. No input is ever pre-filled with `0`.
- All numeric values (prices) use plain text `Input` elements — never `type="number"` / spinner inputs. Parse and validate on submit.
- Store `type` is one of exactly: `warehouse`, `showroom`, `outlet`, `other`.
- The default flag applies only to `warehouse` stores; at most one default exists at any time; a sole warehouse becomes default automatically.
- Match the existing aesthetic: surfaces `#1a1b26` / `#202331`, border `#2f3549`, text `#c0caf5` / `#d5dcff`, muted `#737aa2` / `#565f89`, accent `#7aa2f7`. Labels are lowercase.
- Node.js runtime for all routes: `export const runtime = 'nodejs';`.
- Next.js 16 dynamic route params are async: `{ params }: { params: Promise<{ id: string }> }` and must be awaited.
- Commit after each task with the message shown in that task's final step.

## File Structure

Created:
- `db/init/003_master_data.sql` — tables, constraints, counter seed.
- `lib/master/simple-entity.ts` — shared handlers + PG error helpers for code+name entities.
- `lib/master/api-error.ts` — shared error-code helpers (re-exported from simple-entity; see Task 2).
- `app/api/master/categories/route.ts`, `app/api/master/categories/[id]/route.ts`
- `app/api/master/base-units/route.ts`, `app/api/master/base-units/[id]/route.ts`
- `app/api/master/stores/route.ts`, `app/api/master/stores/[id]/route.ts`
- `app/api/master/products/route.ts`, `app/api/master/products/[id]/route.ts`, `app/api/master/products/reset-sr/route.ts`
- `components/dashboard/master/master-menu.tsx`, `components/dashboard/master/master-menu.module.css`
- `components/dashboard/master/form-field.tsx` — shared TextField/SelectField following input rules.
- `components/dashboard/master/entity-table.tsx` — generic list table with edit/delete row actions.
- `components/dashboard/master/simple-entity-page.tsx` — shared list+form page for Categories and Base Units.
- `components/dashboard/master/store-form.tsx`
- `components/dashboard/master/product-form.tsx`
- `app/dashboard/master/categories/page.tsx`, `app/dashboard/master/base-units/page.tsx`
- `app/dashboard/master/stores/page.tsx`
- `app/dashboard/products/page.tsx`

Modified:
- `components/dashboard/header.tsx` — add Master dropdown + Products link.

---

## Task 1: Database migration

**Files:**
- Create: `db/init/003_master_data.sql`

**Interfaces:**
- Produces: tables `stores`, `categories`, `base_units`, `products`, `counters`; counter row `('product_sr_no', 1)`. Later API tasks depend on these column names exactly.

- [ ] **Step 1: Write the migration SQL**

Create `db/init/003_master_data.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
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
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT NOT NULL REFERENCES categories(id),
  base_unit_id TEXT NOT NULL REFERENCES base_units(id),
  purchase_price NUMERIC(14, 2),
  retail_price NUMERIC(14, 2),
  wholesale_price NUMERIC(14, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS counters (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);

INSERT INTO counters (key, value) VALUES ('product_sr_no', 1)
ON CONFLICT (key) DO NOTHING;
```

- [ ] **Step 2: Bring up Postgres and apply the migration**

Run:

```bash
docker compose up -d postgres
sleep 5
docker compose exec -T postgres psql -U amiplast -d amiplast < db/init/003_master_data.sql
```

Expected: no errors; several `CREATE TABLE` / `CREATE INDEX` / `INSERT 0 1` (or `INSERT 0 0` if already seeded) lines.

> Note: `db/init/*` runs automatically only on a fresh Postgres volume. The command above applies it to an already-running database. It is idempotent, so re-running is safe.

- [ ] **Step 3: Verify the schema and constraints**

Run:

```bash
docker compose exec -T postgres psql -U amiplast -d amiplast -c "\d stores" -c "SELECT * FROM counters;"
```

Expected: `stores` shows the `stores_default_warehouse_only` check and `stores_single_default_idx`; `counters` shows one row `product_sr_no | 1`.

- [ ] **Step 4: Commit**

```bash
git add db/init/003_master_data.sql
git commit -m "Add master data and products schema"
```

---

## Task 2: Shared simple-entity API handlers

**Files:**
- Create: `lib/master/simple-entity.ts`

**Interfaces:**
- Produces:
  - `type SimpleEntity = { id: string; name: string; created_at: string; updated_at: string }`
  - `type SimpleTable = 'categories' | 'base_units'`
  - `listSimple(table: SimpleTable): Promise<NextResponse>`
  - `createSimple(table: SimpleTable, request: Request): Promise<NextResponse>`
  - `updateSimple(table: SimpleTable, id: string, request: Request): Promise<NextResponse>`
  - `deleteSimple(table: SimpleTable, id: string): Promise<NextResponse>`
  - `isUniqueViolation(error: unknown): boolean`
  - `isForeignKeyViolation(error: unknown): boolean`

- [ ] **Step 1: Write the shared handlers**

Create `lib/master/simple-entity.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export type SimpleEntity = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

// Whitelist of allowed table identifiers. Values are interpolated into SQL
// as identifiers, so they MUST come from this map, never from user input.
const TABLES = {
  categories: 'categories',
  base_units: 'base_units',
} as const;

export type SimpleTable = keyof typeof TABLES;

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === '23505'
  );
}

export function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === '23503'
  );
}

export async function listSimple(table: SimpleTable): Promise<NextResponse> {
  const result = await getPool().query<SimpleEntity>(
    `SELECT id, name, created_at, updated_at FROM ${TABLES[table]} ORDER BY id`
  );
  return NextResponse.json({ items: result.rows });
}

export async function createSimple(table: SimpleTable, request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as { id?: string; name?: string } | null;
  const id = body?.id?.trim();
  const name = body?.name?.trim();

  if (!id || !name) {
    return NextResponse.json({ message: 'Code and name are required' }, { status: 400 });
  }

  try {
    const result = await getPool().query<SimpleEntity>(
      `INSERT INTO ${TABLES[table]} (id, name) VALUES ($1, $2)
       RETURNING id, name, created_at, updated_at`,
      [id, name]
    );
    return NextResponse.json({ item: result.rows[0] }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ message: `Code "${id}" already exists` }, { status: 409 });
    }
    throw error;
  }
}

export async function updateSimple(
  table: SimpleTable,
  id: string,
  request: Request
): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json({ message: 'Name is required' }, { status: 400 });
  }

  const result = await getPool().query<SimpleEntity>(
    `UPDATE ${TABLES[table]} SET name = $2, updated_at = NOW() WHERE id = $1
     RETURNING id, name, created_at, updated_at`,
    [id, name]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ item: result.rows[0] });
}

export async function deleteSimple(table: SimpleTable, id: string): Promise<NextResponse> {
  try {
    const result = await getPool().query(`DELETE FROM ${TABLES[table]} WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return NextResponse.json({ message: 'Record is in use by a product' }, { status: 409 });
    }
    throw error;
  }
}
```

- [ ] **Step 2: Verify typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass with no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/master/simple-entity.ts
git commit -m "Add shared simple-entity API handlers"
```

---

## Task 3: Categories and Base Units API routes

**Files:**
- Create: `app/api/master/categories/route.ts`
- Create: `app/api/master/categories/[id]/route.ts`
- Create: `app/api/master/base-units/route.ts`
- Create: `app/api/master/base-units/[id]/route.ts`

**Interfaces:**
- Consumes: `listSimple`, `createSimple`, `updateSimple`, `deleteSimple` from Task 2.
- Produces: HTTP endpoints `GET/POST /api/master/categories`, `PATCH/DELETE /api/master/categories/[id]`, and the same for `/api/master/base-units`.

- [ ] **Step 1: Write the categories collection route**

Create `app/api/master/categories/route.ts`:

```typescript
import { listSimple, createSimple } from '@/lib/master/simple-entity';

export const runtime = 'nodejs';

export async function GET() {
  return listSimple('categories');
}

export async function POST(request: Request) {
  return createSimple('categories', request);
}
```

- [ ] **Step 2: Write the categories item route**

Create `app/api/master/categories/[id]/route.ts`:

```typescript
import { updateSimple, deleteSimple } from '@/lib/master/simple-entity';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateSimple('categories', id, request);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteSimple('categories', id);
}
```

- [ ] **Step 3: Write the base-units routes**

Create `app/api/master/base-units/route.ts`:

```typescript
import { listSimple, createSimple } from '@/lib/master/simple-entity';

export const runtime = 'nodejs';

export async function GET() {
  return listSimple('base_units');
}

export async function POST(request: Request) {
  return createSimple('base_units', request);
}
```

Create `app/api/master/base-units/[id]/route.ts`:

```typescript
import { updateSimple, deleteSimple } from '@/lib/master/simple-entity';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateSimple('base_units', id, request);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteSimple('base_units', id);
}
```

- [ ] **Step 4: Verify typecheck, lint, and runtime**

Run:

```bash
npm run typecheck && npm run lint
npm run dev &
sleep 6
curl -s -X POST localhost:3000/api/master/categories -H 'Content-Type: application/json' -d '{"id":"CAT1","name":"Pipes"}'
curl -s localhost:3000/api/master/categories
curl -s -X POST localhost:3000/api/master/categories -H 'Content-Type: application/json' -d '{"id":"CAT1","name":"Dup"}'
curl -s -X PATCH localhost:3000/api/master/categories/CAT1 -H 'Content-Type: application/json' -d '{"name":"Pipes & Fittings"}'
curl -s -X POST localhost:3000/api/master/base-units -H 'Content-Type: application/json' -d '{"id":"PCS","name":"Pieces"}'
kill %1
```

Expected: first POST returns the created item (201); GET lists it; duplicate POST returns `{"message":"Code \"CAT1\" already exists"}` (409); PATCH returns updated name; base-unit POST returns the created item. Keep `CAT1` and `PCS` — Task 6 uses them.

- [ ] **Step 5: Commit**

```bash
git add app/api/master/categories app/api/master/base-units
git commit -m "Add categories and base-units API routes"
```

---

## Task 4: Stores API routes

**Files:**
- Create: `app/api/master/stores/route.ts`
- Create: `app/api/master/stores/[id]/route.ts`

**Interfaces:**
- Consumes: `getPool` from `@/lib/db`; `isUniqueViolation` from Task 2.
- Produces:
  - `type StoreRow = { id: string; name: string; address: string | null; phone: string | null; type: string; is_default: boolean; created_at: string; updated_at: string }`
  - `GET/POST /api/master/stores`, `PATCH/DELETE /api/master/stores/[id]`.

- [ ] **Step 1: Write the stores collection route**

Create `app/api/master/stores/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getPool } from '@/lib/db';
import { isUniqueViolation } from '@/lib/master/simple-entity';

export const runtime = 'nodejs';

export const STORE_TYPES = ['warehouse', 'showroom', 'outlet', 'other'] as const;
export type StoreType = (typeof STORE_TYPES)[number];

export type StoreRow = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

const SELECT_COLS =
  'id, name, address, phone, type, is_default, created_at, updated_at';

// Ensures exactly one default warehouse when there is a single warehouse and
// none is currently marked default. Call inside an open transaction.
export async function ensureSoleWarehouseDefault(client: PoolClient): Promise<void> {
  const warehouses = await client.query(
    "SELECT id FROM stores WHERE type = 'warehouse'"
  );
  if (warehouses.rowCount !== 1) return;
  const anyDefault = await client.query('SELECT 1 FROM stores WHERE is_default LIMIT 1');
  if (anyDefault.rowCount === 0) {
    await client.query(
      'UPDATE stores SET is_default = TRUE, updated_at = NOW() WHERE id = $1',
      [warehouses.rows[0].id]
    );
  }
}

export async function GET() {
  const result = await getPool().query<StoreRow>(
    `SELECT ${SELECT_COLS} FROM stores ORDER BY id`
  );
  return NextResponse.json({ items: result.rows });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<{
    id: string;
    name: string;
    address: string;
    phone: string;
    type: string;
    is_default: boolean;
  }> | null;

  const id = body?.id?.trim();
  const name = body?.name?.trim();
  const type = body?.type?.trim();
  const address = body?.address?.trim() || null;
  const phone = body?.phone?.trim() || null;
  let isDefault = Boolean(body?.is_default);

  if (!id || !name || !type) {
    return NextResponse.json({ message: 'Code, name, and type are required' }, { status: 400 });
  }
  if (!STORE_TYPES.includes(type as StoreType)) {
    return NextResponse.json({ message: 'Invalid store type' }, { status: 400 });
  }
  if (isDefault && type !== 'warehouse') {
    return NextResponse.json(
      { message: 'Only a warehouse can be the default store' },
      { status: 400 }
    );
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    // A brand-new warehouse becomes default automatically when it is the first one.
    if (type === 'warehouse' && !isDefault) {
      const existing = await client.query(
        "SELECT 1 FROM stores WHERE type = 'warehouse' LIMIT 1"
      );
      if (existing.rowCount === 0) isDefault = true;
    }

    if (isDefault) {
      await client.query('UPDATE stores SET is_default = FALSE, updated_at = NOW() WHERE is_default');
    }

    const result = await client.query<StoreRow>(
      `INSERT INTO stores (id, name, address, phone, type, is_default)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${SELECT_COLS}`,
      [id, name, address, phone, type, isDefault]
    );

    await client.query('COMMIT');
    return NextResponse.json({ item: result.rows[0] }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    if (isUniqueViolation(error)) {
      return NextResponse.json({ message: `Store code "${id}" already exists` }, { status: 409 });
    }
    throw error;
  } finally {
    client.release();
  }
}
```

- [ ] **Step 2: Write the stores item route**

Create `app/api/master/stores/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import {
  STORE_TYPES,
  type StoreType,
  type StoreRow,
  ensureSoleWarehouseDefault,
} from '../route';

export const runtime = 'nodejs';

const SELECT_COLS =
  'id, name, address, phone, type, is_default, created_at, updated_at';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Partial<{
    name: string;
    address: string;
    phone: string;
    type: string;
    is_default: boolean;
  }> | null;

  const name = body?.name?.trim();
  const type = body?.type?.trim();
  const address = body?.address?.trim() || null;
  const phone = body?.phone?.trim() || null;
  const isDefault = Boolean(body?.is_default);

  if (!name || !type) {
    return NextResponse.json({ message: 'Name and type are required' }, { status: 400 });
  }
  if (!STORE_TYPES.includes(type as StoreType)) {
    return NextResponse.json({ message: 'Invalid store type' }, { status: 400 });
  }
  if (isDefault && type !== 'warehouse') {
    return NextResponse.json(
      { message: 'Only a warehouse can be the default store' },
      { status: 400 }
    );
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    if (isDefault) {
      await client.query(
        'UPDATE stores SET is_default = FALSE, updated_at = NOW() WHERE is_default AND id <> $1',
        [id]
      );
    }

    const result = await client.query<StoreRow>(
      `UPDATE stores
         SET name = $2, address = $3, phone = $4, type = $5, is_default = $6, updated_at = NOW()
       WHERE id = $1
       RETURNING ${SELECT_COLS}`,
      [id, name, address, phone, type, isDefault]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    // Changing a store away from warehouse (or clearing its default) may leave
    // a lone remaining warehouse with no default.
    await ensureSoleWarehouseDefault(client);

    await client.query('COMMIT');
    return NextResponse.json({ item: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('DELETE FROM stores WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }
    // Deleting the default warehouse may leave a single remaining warehouse
    // that should now become default automatically.
    await ensureSoleWarehouseDefault(client);
    await client.query('COMMIT');
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

- [ ] **Step 3: Verify typecheck, lint, and the default rule at runtime**

Run:

```bash
npm run typecheck && npm run lint
npm run dev &
sleep 6
# First warehouse auto-defaults:
curl -s -X POST localhost:3000/api/master/stores -H 'Content-Type: application/json' -d '{"id":"WH01","name":"Main WH","type":"warehouse"}'
# Second warehouse is NOT default:
curl -s -X POST localhost:3000/api/master/stores -H 'Content-Type: application/json' -d '{"id":"WH02","name":"Second WH","type":"warehouse"}'
# Non-warehouse cannot be default:
curl -s -X POST localhost:3000/api/master/stores -H 'Content-Type: application/json' -d '{"id":"SR01","name":"Showroom","type":"showroom","is_default":true}'
# Marking WH02 default clears WH01:
curl -s -X PATCH localhost:3000/api/master/stores/WH02 -H 'Content-Type: application/json' -d '{"name":"Second WH","type":"warehouse","is_default":true}'
curl -s localhost:3000/api/master/stores
kill %1
```

Expected: `WH01` returns with `is_default: true`; `WH02` returns with `is_default: false`; the showroom POST returns the 400 message about warehouse-only default; after the PATCH the final list shows `WH02` default `true` and `WH01` default `false`.

- [ ] **Step 4: Commit**

```bash
git add app/api/master/stores
git commit -m "Add stores API routes with default-warehouse rules"
```

---

## Task 5: Products API routes

**Files:**
- Create: `app/api/master/products/route.ts`
- Create: `app/api/master/products/[id]/route.ts`
- Create: `app/api/master/products/reset-sr/route.ts`

**Interfaces:**
- Consumes: `getPool`; `isUniqueViolation`, `isForeignKeyViolation` from Task 2.
- Produces:
  - `type ProductRow` with fields `id, sr_no, sku, name, description, category_id, base_unit_id, category_name, base_unit_name, purchase_price, retail_price, wholesale_price, created_at, updated_at`.
  - `GET/POST /api/master/products`, `PATCH/DELETE /api/master/products/[id]`, `POST /api/master/products/reset-sr`.

- [ ] **Step 1: Write the products collection route**

Create `app/api/master/products/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { isUniqueViolation, isForeignKeyViolation } from '@/lib/master/simple-entity';

export const runtime = 'nodejs';

export type ProductRow = {
  id: string;
  sr_no: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: string;
  base_unit_id: string;
  purchase_price: string | null;
  retail_price: string | null;
  wholesale_price: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductListRow = ProductRow & {
  category_name: string;
  base_unit_name: string;
};

// Parses an optional money string. Returns { ok, value } where value is a
// numeric string or null. Empty/blank -> null. Non-numeric -> not ok.
export function parseMoney(raw: unknown): { ok: boolean; value: string | null } {
  if (raw === undefined || raw === null) return { ok: true, value: null };
  const trimmed = String(raw).trim();
  if (trimmed === '') return { ok: true, value: null };
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return { ok: false, value: null };
  return { ok: true, value: trimmed };
}

export async function GET() {
  const result = await getPool().query<ProductListRow>(
    `SELECT p.id, p.sr_no, p.sku, p.name, p.description, p.category_id, p.base_unit_id,
            p.purchase_price, p.retail_price, p.wholesale_price, p.created_at, p.updated_at,
            c.name AS category_name, u.name AS base_unit_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN base_units u ON u.id = p.base_unit_id
      ORDER BY p.sr_no`
  );
  return NextResponse.json({ items: result.rows });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<{
    sku: string;
    name: string;
    description: string;
    category_id: string;
    base_unit_id: string;
    purchase_price: string;
    retail_price: string;
    wholesale_price: string;
  }> | null;

  const sku = body?.sku?.trim();
  const name = body?.name?.trim();
  const description = body?.description?.trim() || null;
  const categoryId = body?.category_id?.trim();
  const baseUnitId = body?.base_unit_id?.trim();

  if (!sku || !name || !categoryId || !baseUnitId) {
    return NextResponse.json(
      { message: 'SKU, name, category, and base unit are required' },
      { status: 400 }
    );
  }

  const purchase = parseMoney(body?.purchase_price);
  const retail = parseMoney(body?.retail_price);
  const wholesale = parseMoney(body?.wholesale_price);
  if (!purchase.ok || !retail.ok || !wholesale.ok) {
    return NextResponse.json({ message: 'Prices must be valid amounts' }, { status: 400 });
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    // Atomically read the current Sr No and advance the counter.
    const counter = await client.query<{ sr_no: number }>(
      "UPDATE counters SET value = value + 1 WHERE key = 'product_sr_no' RETURNING value - 1 AS sr_no"
    );
    const srNo = counter.rows[0].sr_no;

    const result = await client.query<ProductRow>(
      `INSERT INTO products
         (sr_no, sku, name, description, category_id, base_unit_id,
          purchase_price, retail_price, wholesale_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, sr_no, sku, name, description, category_id, base_unit_id,
                 purchase_price, retail_price, wholesale_price, created_at, updated_at`,
      [srNo, sku, name, description, categoryId, baseUnitId, purchase.value, retail.value, wholesale.value]
    );
    await client.query('COMMIT');
    return NextResponse.json({ item: result.rows[0] }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    if (isUniqueViolation(error)) {
      return NextResponse.json({ message: `SKU "${sku}" already exists` }, { status: 409 });
    }
    if (isForeignKeyViolation(error)) {
      return NextResponse.json({ message: 'Category or base unit does not exist' }, { status: 400 });
    }
    throw error;
  } finally {
    client.release();
  }
}
```

- [ ] **Step 2: Write the products item route**

Create `app/api/master/products/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { isUniqueViolation, isForeignKeyViolation } from '@/lib/master/simple-entity';
import { parseMoney, type ProductRow } from '../route';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Partial<{
    sku: string;
    name: string;
    description: string;
    category_id: string;
    base_unit_id: string;
    purchase_price: string;
    retail_price: string;
    wholesale_price: string;
  }> | null;

  const sku = body?.sku?.trim();
  const name = body?.name?.trim();
  const description = body?.description?.trim() || null;
  const categoryId = body?.category_id?.trim();
  const baseUnitId = body?.base_unit_id?.trim();

  if (!sku || !name || !categoryId || !baseUnitId) {
    return NextResponse.json(
      { message: 'SKU, name, category, and base unit are required' },
      { status: 400 }
    );
  }

  const purchase = parseMoney(body?.purchase_price);
  const retail = parseMoney(body?.retail_price);
  const wholesale = parseMoney(body?.wholesale_price);
  if (!purchase.ok || !retail.ok || !wholesale.ok) {
    return NextResponse.json({ message: 'Prices must be valid amounts' }, { status: 400 });
  }

  try {
    const result = await getPool().query<ProductRow>(
      `UPDATE products
         SET sku = $2, name = $3, description = $4, category_id = $5, base_unit_id = $6,
             purchase_price = $7, retail_price = $8, wholesale_price = $9, updated_at = NOW()
       WHERE id = $1
       RETURNING id, sr_no, sku, name, description, category_id, base_unit_id,
                 purchase_price, retail_price, wholesale_price, created_at, updated_at`,
      [id, sku, name, description, categoryId, baseUnitId, purchase.value, retail.value, wholesale.value]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ item: result.rows[0] });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ message: `SKU "${sku}" already exists` }, { status: 409 });
    }
    if (isForeignKeyViolation(error)) {
      return NextResponse.json({ message: 'Category or base unit does not exist' }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPool().query('DELETE FROM products WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Write the reset-sr route**

Create `app/api/master/products/reset-sr/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST() {
  await getPool().query("UPDATE counters SET value = 1 WHERE key = 'product_sr_no'");
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Verify typecheck, lint, and runtime**

Run (relies on `CAT1` and `PCS` from Task 3):

```bash
npm run typecheck && npm run lint
npm run dev &
sleep 6
curl -s -X POST localhost:3000/api/master/products -H 'Content-Type: application/json' -d '{"sku":"P-001","name":"Widget","category_id":"CAT1","base_unit_id":"PCS","retail_price":"12.50"}'
curl -s -X POST localhost:3000/api/master/products -H 'Content-Type: application/json' -d '{"sku":"P-002","name":"Gadget","category_id":"CAT1","base_unit_id":"PCS"}'
curl -s localhost:3000/api/master/products
# Bad price rejected:
curl -s -X POST localhost:3000/api/master/products -H 'Content-Type: application/json' -d '{"sku":"P-003","name":"Bad","category_id":"CAT1","base_unit_id":"PCS","retail_price":"abc"}'
# Reset counter, next product gets sr_no 1:
curl -s -X POST localhost:3000/api/master/products/reset-sr
curl -s -X POST localhost:3000/api/master/products -H 'Content-Type: application/json' -d '{"sku":"P-100","name":"AfterReset","category_id":"CAT1","base_unit_id":"PCS"}'
kill %1
```

Expected: `P-001` has `sr_no: 1`, `P-002` has `sr_no: 2`; the list is ordered by `sr_no` and includes `category_name` / `base_unit_name`; the `abc` price returns `{"message":"Prices must be valid amounts"}` (400); after reset, `P-100` has `sr_no: 1`.

- [ ] **Step 5: Commit**

```bash
git add app/api/master/products
git commit -m "Add products API routes with Sr No counter and reset"
```

---

## Task 6: Shared UI primitives (form fields + entity table)

**Files:**
- Create: `components/dashboard/master/form-field.tsx`
- Create: `components/dashboard/master/entity-table.tsx`

**Interfaces:**
- Produces:
  - `TextField({ id, label, value, onChange, placeholder?, textarea? }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean })`
  - `SelectField({ id, label, value, options, onChange, children? }: { id: string; label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; children?: React.ReactNode })`
  - `type Column<T> = { header: string; cell: (row: T) => React.ReactNode }`
  - `EntityTable<T>({ columns, rows, rowKey, onEdit, onDelete, empty }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; onEdit: (row: T) => void; onDelete: (row: T) => void; empty: string })`

- [ ] **Step 1: Write the form-field components**

Create `components/dashboard/master/form-field.tsx`:

```tsx
'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const controlClass =
  'w-full rounded border border-[#2f3549] bg-[#1a1b26] px-3 py-2 text-sm text-[#c0caf5] outline-none focus:border-[#7aa2f7]';

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  textarea = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div className="mb-4">
      <Label htmlFor={id} className="mb-1 block">
        {label}
      </Label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`${controlClass} placeholder:text-[#565f89]`}
        />
      ) : (
        <Input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`h-auto ${controlClass} placeholder:text-[#565f89]`}
        />
      )}
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <Label htmlFor={id} className="mb-1 block">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={controlClass}
      >
        <option value="">— select —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {children}
    </div>
  );
}
```

Note: all text fields start empty and use `type="text"`, satisfying the input rules. Prices will reuse `TextField`.

- [ ] **Step 2: Write the entity-table component**

Create `components/dashboard/master/entity-table.tsx`:

```tsx
'use client';

import * as React from 'react';

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
};

export function EntityTable<T>({
  columns,
  rows,
  rowKey,
  onEdit,
  onDelete,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-[#565f89]">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-[#2f3549]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#2f3549] text-left text-[#7aa2f7]">
            {columns.map((col) => (
              <th key={col.header} className="px-4 py-2 font-medium lowercase tracking-wide">
                {col.header}
              </th>
            ))}
            <th className="px-4 py-2 text-right font-medium lowercase tracking-wide">actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-[#2f3549] last:border-0 text-[#c0caf5]">
              {columns.map((col) => (
                <td key={col.header} className="px-4 py-2">
                  {col.cell(row)}
                </td>
              ))}
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => onEdit(row)}
                  className="mr-3 text-[#7aa2f7] hover:underline"
                >
                  edit
                </button>
                <button
                  onClick={() => onDelete(row)}
                  className="text-[#f7768e] hover:underline"
                >
                  delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Verify typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/master/form-field.tsx components/dashboard/master/entity-table.tsx
git commit -m "Add shared master-data form fields and entity table"
```

---

## Task 7: Header Master menu and Products link

**Files:**
- Create: `components/dashboard/master/master-menu.tsx`
- Create: `components/dashboard/master/master-menu.module.css`
- Modify: `components/dashboard/header.tsx`

**Interfaces:**
- Consumes: nothing from prior tasks (navigation only).
- Produces: `MasterMenu` component rendered in the header; navigation to `/dashboard/master/stores`, `/dashboard/master/categories`, `/dashboard/master/base-units`, `/dashboard/products`.

- [ ] **Step 1: Write the master-menu styles**

Create `components/dashboard/master/master-menu.module.css`:

```css
.wrapper {
  position: relative;
}

.trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid #2f3549;
  background: transparent;
  color: #c0caf5;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.trigger:hover {
  color: #7aa2f7;
  border-color: #7aa2f7;
  background: #1a1b26;
}

.menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 50;
  min-width: 180px;
  padding: 6px;
  border-radius: 8px;
  border: 1px solid #2f3549;
  background: #202331;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
}

.item {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: #c0caf5;
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.item:hover {
  background: #1a1b26;
  color: #7aa2f7;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
}
```

- [ ] **Step 2: Write the MasterMenu component**

Create `components/dashboard/master/master-menu.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './master-menu.module.css';

function GridIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

const ITEMS = [
  { label: 'stores', path: '/dashboard/master/stores' },
  { label: 'categories', path: '/dashboard/master/categories' },
  { label: 'base units', path: '/dashboard/master/base-units' },
];

export function MasterMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <div className={styles.wrapper}>
      <button className={styles.trigger} onClick={() => setOpen((v) => !v)}>
        <GridIcon />
        <span>master</span>
      </button>
      {open && (
        <>
          <div className={styles.menu}>
            {ITEMS.map((item) => (
              <button key={item.path} className={styles.item} onClick={() => go(item.path)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire the menu and Products link into the header**

Modify `components/dashboard/header.tsx`. Add the import near the other imports:

```tsx
import Link from 'next/link';
import { MasterMenu } from '../master/master-menu';
```

Replace the `<div className={styles.left}>...</div>` block with:

```tsx
      <div className={styles.left}>
        <p className={`${styles.title} text-base font-bold`}>* Amiplast</p>
        <MasterMenu />
        <Link href="/dashboard/products" className={styles.trigger}>
          products
        </Link>
        <p className={`${styles.path} text-xs`}>{pathLabel}</p>
      </div>
```

Then add a `.trigger` style to `components/dashboard/header.module.css` so the Products link matches the Master button:

```css
.trigger {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid #2f3549;
  background: transparent;
  color: #c0caf5;
  font-size: 13px;
  text-decoration: none;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.trigger:hover {
  color: #7aa2f7;
  border-color: #7aa2f7;
  background: #1a1b26;
}
```

- [ ] **Step 4: Verify typecheck, lint, and render**

Run:

```bash
npm run typecheck && npm run lint
npm run dev &
sleep 6
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/dashboard
kill %1
```

Expected: typecheck/lint pass; the dashboard route responds (a redirect `307`/`308` to login or `200` are both acceptable — the header compiles without error). Then confirm visually in a browser that the header shows a "master" dropdown and a "products" link.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/master/master-menu.tsx components/dashboard/master/master-menu.module.css components/dashboard/header.tsx components/dashboard/header.module.css
git commit -m "Add Master menu and Products link to dashboard header"
```

---

## Task 8: Categories and Base Units pages

**Files:**
- Create: `components/dashboard/master/simple-entity-page.tsx`
- Create: `app/dashboard/master/categories/page.tsx`
- Create: `app/dashboard/master/base-units/page.tsx`

**Interfaces:**
- Consumes: `TextField` (Task 6), `EntityTable`, `Column` (Task 6); `Button` from `@/components/ui/button`; the categories/base-units API from Task 3.
- Produces: `SimpleEntityPage({ title, apiPath, codeLabel }: { title: string; apiPath: string; codeLabel: string })`.

- [ ] **Step 1: Write the shared simple-entity page**

Create `components/dashboard/master/simple-entity-page.tsx`:

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from './form-field';
import { EntityTable, type Column } from './entity-table';

type Item = { id: string; name: string };

export function SimpleEntityPage({
  title,
  apiPath,
  codeLabel,
}: {
  title: string;
  apiPath: string;
  codeLabel: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(apiPath);
    const data = await res.json();
    setItems(data.items ?? []);
  }, [apiPath]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setCode('');
    setName('');
    setError('');
    setShowForm(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    setCode(item.id);
    setName(item.name);
    setError('');
    setShowForm(true);
  }

  async function submit() {
    setError('');
    const res = editing
      ? await fetch(`${apiPath}/${encodeURIComponent(editing.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
      : await fetch(apiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: code, name }),
        });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? 'Something went wrong');
      return;
    }
    setShowForm(false);
    await load();
  }

  async function remove(item: Item) {
    if (!window.confirm(`Delete "${item.id}"?`)) return;
    const res = await fetch(`${apiPath}/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.message ?? 'Delete failed');
      return;
    }
    await load();
  }

  const columns: Column<Item>[] = [
    { header: codeLabel, cell: (row) => row.id },
    { header: 'name', cell: (row) => row.name },
  ];

  return (
    <main className="mx-auto max-w-[720px] px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#d5dcff]">{title}</h1>
        <Button onClick={openCreate}>+ new</Button>
      </div>

      {showForm && (
        <section className="mb-8 rounded border border-[#2f3549] bg-[#202331] p-6">
          <h2 className="mb-4 text-base font-bold text-[#d5dcff]">
            {editing ? 'edit' : 'create'}
          </h2>
          {!editing && (
            <TextField id="code" label={codeLabel} value={code} onChange={setCode} />
          )}
          <TextField id="name" label="name" value={name} onChange={setName} />
          {error && <p className="mb-4 text-sm text-[#f7768e]">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={submit}>save</Button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-[#737aa2] hover:text-[#c0caf5]"
            >
              cancel
            </button>
          </div>
        </section>
      )}

      <EntityTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        onEdit={openEdit}
        onDelete={remove}
        empty="no records yet."
      />
    </main>
  );
}
```

- [ ] **Step 2: Write the two pages**

Create `app/dashboard/master/categories/page.tsx`:

```tsx
import { SimpleEntityPage } from '@/components/dashboard/master/simple-entity-page';

export default function CategoriesPage() {
  return (
    <SimpleEntityPage title="categories" apiPath="/api/master/categories" codeLabel="category id" />
  );
}
```

Create `app/dashboard/master/base-units/page.tsx`:

```tsx
import { SimpleEntityPage } from '@/components/dashboard/master/simple-entity-page';

export default function BaseUnitsPage() {
  return (
    <SimpleEntityPage title="base units" apiPath="/api/master/base-units" codeLabel="unit id" />
  );
}
```

- [ ] **Step 3: Verify typecheck, lint, and runtime**

Run:

```bash
npm run typecheck && npm run lint
npm run dev &
sleep 6
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/dashboard/master/categories
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/dashboard/master/base-units
kill %1
```

Expected: typecheck/lint pass; both routes respond (`200` or an auth redirect). Then log in via the browser and confirm: create a category, see it in the table, edit its name, and delete it.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/master/simple-entity-page.tsx app/dashboard/master/categories app/dashboard/master/base-units
git commit -m "Add categories and base-units management pages"
```

---

## Task 9: Stores page

**Files:**
- Create: `components/dashboard/master/store-form.tsx`
- Create: `app/dashboard/master/stores/page.tsx`

**Interfaces:**
- Consumes: `TextField`, `SelectField` (Task 6); `EntityTable`, `Column` (Task 6); `Button`; the stores API from Task 4.
- Produces: `StoresPage` default export.

- [ ] **Step 1: Write the store form**

Create `components/dashboard/master/store-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField, SelectField } from './form-field';

export type StoreDraft = {
  id: string;
  name: string;
  address: string;
  phone: string;
  type: string;
  is_default: boolean;
};

const TYPE_OPTIONS = [
  { value: 'warehouse', label: 'warehouse' },
  { value: 'showroom', label: 'showroom' },
  { value: 'outlet', label: 'outlet' },
  { value: 'other', label: 'other' },
];

export function StoreForm({
  initial,
  isEdit,
  onSubmit,
  onCancel,
}: {
  initial: StoreDraft;
  isEdit: boolean;
  onSubmit: (draft: StoreDraft) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<StoreDraft>(initial);
  const [error, setError] = useState('');

  function set<K extends keyof StoreDraft>(key: K, value: StoreDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handleSave() {
    setError('');
    const message = await onSubmit(draft);
    if (message) setError(message);
  }

  const canBeDefault = draft.type === 'warehouse';

  return (
    <section className="mb-8 rounded border border-[#2f3549] bg-[#202331] p-6">
      <h2 className="mb-4 text-base font-bold text-[#d5dcff]">{isEdit ? 'edit store' : 'create store'}</h2>
      {!isEdit && (
        <TextField id="id" label="store id" value={draft.id} onChange={(v) => set('id', v)} />
      )}
      <TextField id="name" label="store name" value={draft.name} onChange={(v) => set('name', v)} />
      <TextField id="address" label="address" value={draft.address} onChange={(v) => set('address', v)} textarea />
      <TextField id="phone" label="phone" value={draft.phone} onChange={(v) => set('phone', v)} />
      <SelectField
        id="type"
        label="type"
        value={draft.type}
        options={TYPE_OPTIONS}
        onChange={(v) => {
          set('type', v);
          if (v !== 'warehouse') set('is_default', false);
        }}
      />
      <label className="mb-4 flex items-center gap-2 text-sm text-[#c0caf5]">
        <input
          type="checkbox"
          checked={draft.is_default}
          disabled={!canBeDefault}
          onChange={(e) => set('is_default', e.target.checked)}
        />
        <span className={canBeDefault ? '' : 'text-[#565f89]'}>
          default (warehouse only)
        </span>
      </label>
      {error && <p className="mb-4 text-sm text-[#f7768e]">{error}</p>}
      <div className="flex gap-3">
        <Button onClick={handleSave}>save</Button>
        <button onClick={onCancel} className="text-sm text-[#737aa2] hover:text-[#c0caf5]">
          cancel
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write the stores page**

Create `app/dashboard/master/stores/page.tsx`:

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { EntityTable, type Column } from '@/components/dashboard/master/entity-table';
import { StoreForm, type StoreDraft } from '@/components/dashboard/master/store-form';

type Store = StoreDraft & { created_at: string; updated_at: string };

const EMPTY: StoreDraft = { id: '', name: '', address: '', phone: '', type: '', is_default: false };

export default function StoresPage() {
  const [items, setItems] = useState<Store[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/master/stores');
    const data = await res.json();
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(store: Store) {
    setEditing(store);
    setShowForm(true);
  }

  async function submit(draft: StoreDraft): Promise<string | null> {
    const res = editing
      ? await fetch(`/api/master/stores/${encodeURIComponent(editing.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        })
      : await fetch('/api/master/stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.message ?? 'Something went wrong';
    }
    setShowForm(false);
    await load();
    return null;
  }

  async function remove(store: Store) {
    if (!window.confirm(`Delete store "${store.id}"?`)) return;
    const res = await fetch(`/api/master/stores/${encodeURIComponent(store.id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.message ?? 'Delete failed');
      return;
    }
    await load();
  }

  const columns: Column<Store>[] = [
    { header: 'store id', cell: (row) => row.id },
    { header: 'name', cell: (row) => row.name },
    { header: 'type', cell: (row) => row.type },
    { header: 'phone', cell: (row) => row.phone || '—' },
    { header: 'default', cell: (row) => (row.is_default ? 'yes' : '') },
  ];

  return (
    <main className="mx-auto max-w-[820px] px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#d5dcff]">stores</h1>
        <Button onClick={openCreate}>+ new</Button>
      </div>

      {showForm && (
        <StoreForm
          initial={editing ?? EMPTY}
          isEdit={Boolean(editing)}
          onSubmit={submit}
          onCancel={() => setShowForm(false)}
        />
      )}

      <EntityTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        onEdit={openEdit}
        onDelete={remove}
        empty="no stores yet."
      />
    </main>
  );
}
```

- [ ] **Step 3: Verify typecheck, lint, and runtime**

Run:

```bash
npm run typecheck && npm run lint
npm run dev &
sleep 6
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/dashboard/master/stores
kill %1
```

Expected: typecheck/lint pass; route responds. Then in the browser: create a warehouse (confirm it is auto-marked default in the table), create a second warehouse (not default), edit it to default (confirm the first flips off), create a showroom (the default checkbox is disabled), and delete a store.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/master/store-form.tsx app/dashboard/master/stores
git commit -m "Add stores management page"
```

---

## Task 10: Products page with inline quick-create

**Files:**
- Create: `components/dashboard/master/product-form.tsx`
- Create: `app/dashboard/products/page.tsx`

**Interfaces:**
- Consumes: `TextField`, `SelectField` (Task 6); `EntityTable`, `Column` (Task 6); `Button`; the products API (Task 5) and categories/base-units API (Task 3).
- Produces: `ProductsPage` default export.

- [ ] **Step 1: Write the product form (with inline quick-create)**

Create `components/dashboard/master/product-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField, SelectField } from './form-field';

export type ProductDraft = {
  sku: string;
  name: string;
  description: string;
  category_id: string;
  base_unit_id: string;
  purchase_price: string;
  retail_price: string;
  wholesale_price: string;
};

type Option = { value: string; label: string };

// Inline "+ new" sub-form for creating a category or base unit without leaving
// the product form. On success it returns the new id to the caller.
function QuickCreate({
  label,
  apiPath,
  onCreated,
  onCancel,
}: {
  label: string;
  apiPath: string;
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function create() {
    setError('');
    const res = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: code, name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? 'Create failed');
      return;
    }
    const data = await res.json();
    onCreated(data.item.id);
  }

  return (
    <div className="mb-4 rounded border border-[#2f3549] bg-[#1a1b26] p-3">
      <p className="mb-2 text-xs lowercase tracking-wide text-[#7aa2f7]">new {label}</p>
      <TextField id={`qc-${label}-code`} label="code" value={code} onChange={setCode} />
      <TextField id={`qc-${label}-name`} label="name" value={name} onChange={setName} />
      {error && <p className="mb-2 text-sm text-[#f7768e]">{error}</p>}
      <div className="flex gap-3">
        <Button onClick={create}>add</Button>
        <button onClick={onCancel} className="text-sm text-[#737aa2] hover:text-[#c0caf5]">
          cancel
        </button>
      </div>
    </div>
  );
}

export function ProductForm({
  initial,
  isEdit,
  categories,
  baseUnits,
  onSubmit,
  onCancel,
  onCategoryCreated,
  onBaseUnitCreated,
}: {
  initial: ProductDraft;
  isEdit: boolean;
  categories: Option[];
  baseUnits: Option[];
  onSubmit: (draft: ProductDraft) => Promise<string | null>;
  onCancel: () => void;
  onCategoryCreated: (id: string) => Promise<void>;
  onBaseUnitCreated: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ProductDraft>(initial);
  const [error, setError] = useState('');
  const [quick, setQuick] = useState<'category' | 'base_unit' | null>(null);

  function set<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handleSave() {
    setError('');
    const message = await onSubmit(draft);
    if (message) setError(message);
  }

  return (
    <section className="mb-8 rounded border border-[#2f3549] bg-[#202331] p-6">
      <h2 className="mb-4 text-base font-bold text-[#d5dcff]">{isEdit ? 'edit product' : 'create product'}</h2>

      <TextField id="sku" label="sku" value={draft.sku} onChange={(v) => set('sku', v)} />
      <TextField id="name" label="name" value={draft.name} onChange={(v) => set('name', v)} />
      <TextField id="description" label="description" value={draft.description} onChange={(v) => set('description', v)} textarea />

      <SelectField
        id="category_id"
        label="category"
        value={draft.category_id}
        options={categories}
        onChange={(v) => set('category_id', v)}
      >
        <button
          type="button"
          onClick={() => setQuick(quick === 'category' ? null : 'category')}
          className="mt-1 text-xs text-[#7aa2f7] hover:underline"
        >
          + new category
        </button>
      </SelectField>
      {quick === 'category' && (
        <QuickCreate
          label="category"
          apiPath="/api/master/categories"
          onCreated={async (id) => {
            await onCategoryCreated(id);
            set('category_id', id);
            setQuick(null);
          }}
          onCancel={() => setQuick(null)}
        />
      )}

      <SelectField
        id="base_unit_id"
        label="base unit"
        value={draft.base_unit_id}
        options={baseUnits}
        onChange={(v) => set('base_unit_id', v)}
      >
        <button
          type="button"
          onClick={() => setQuick(quick === 'base_unit' ? null : 'base_unit')}
          className="mt-1 text-xs text-[#7aa2f7] hover:underline"
        >
          + new base unit
        </button>
      </SelectField>
      {quick === 'base_unit' && (
        <QuickCreate
          label="base unit"
          apiPath="/api/master/base-units"
          onCreated={async (id) => {
            await onBaseUnitCreated(id);
            set('base_unit_id', id);
            setQuick(null);
          }}
          onCancel={() => setQuick(null)}
        />
      )}

      <TextField id="purchase_price" label="purchase price" value={draft.purchase_price} onChange={(v) => set('purchase_price', v)} />
      <TextField id="retail_price" label="retail price" value={draft.retail_price} onChange={(v) => set('retail_price', v)} />
      <TextField id="wholesale_price" label="wholesale price" value={draft.wholesale_price} onChange={(v) => set('wholesale_price', v)} />

      {error && <p className="mb-4 text-sm text-[#f7768e]">{error}</p>}
      <div className="flex gap-3">
        <Button onClick={handleSave}>save</Button>
        <button onClick={onCancel} className="text-sm text-[#737aa2] hover:text-[#c0caf5]">
          cancel
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write the products page**

Create `app/dashboard/products/page.tsx`:

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { EntityTable, type Column } from '@/components/dashboard/master/entity-table';
import { ProductForm, type ProductDraft } from '@/components/dashboard/master/product-form';

type Option = { value: string; label: string };

type Product = {
  id: string;
  sr_no: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: string;
  base_unit_id: string;
  category_name: string;
  base_unit_name: string;
  purchase_price: string | null;
  retail_price: string | null;
  wholesale_price: string | null;
};

const EMPTY: ProductDraft = {
  sku: '',
  name: '',
  description: '',
  category_id: '',
  base_unit_id: '',
  purchase_price: '',
  retail_price: '',
  wholesale_price: '',
};

function toOptions(items: { id: string; name: string }[]): Option[] {
  return items.map((it) => ({ value: it.id, label: `${it.id} — ${it.name}` }));
}

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [baseUnits, setBaseUnits] = useState<Option[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    const res = await fetch('/api/master/products');
    const data = await res.json();
    setItems(data.items ?? []);
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/master/categories');
    const data = await res.json();
    setCategories(toOptions(data.items ?? []));
  }, []);

  const loadBaseUnits = useCallback(async () => {
    const res = await fetch('/api/master/base-units');
    const data = await res.json();
    setBaseUnits(toOptions(data.items ?? []));
  }, []);

  useEffect(() => {
    void loadProducts();
    void loadCategories();
    void loadBaseUnits();
  }, [loadProducts, loadCategories, loadBaseUnits]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setShowForm(true);
  }

  function draftFrom(product: Product): ProductDraft {
    return {
      sku: product.sku,
      name: product.name,
      description: product.description ?? '',
      category_id: product.category_id,
      base_unit_id: product.base_unit_id,
      purchase_price: product.purchase_price ?? '',
      retail_price: product.retail_price ?? '',
      wholesale_price: product.wholesale_price ?? '',
    };
  }

  async function submit(draft: ProductDraft): Promise<string | null> {
    const res = editing
      ? await fetch(`/api/master/products/${encodeURIComponent(editing.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        })
      : await fetch('/api/master/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.message ?? 'Something went wrong';
    }
    setShowForm(false);
    await loadProducts();
    return null;
  }

  async function remove(product: Product) {
    if (!window.confirm(`Delete product "${product.sku}"?`)) return;
    const res = await fetch(`/api/master/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.message ?? 'Delete failed');
      return;
    }
    await loadProducts();
  }

  async function resetSrNo() {
    if (!window.confirm('Reset the product Sr No counter back to 1?')) return;
    await fetch('/api/master/products/reset-sr', { method: 'POST' });
    window.alert('Sr No counter reset to 1.');
  }

  const columns: Column<Product>[] = [
    { header: 'sr no', cell: (row) => row.sr_no },
    { header: 'sku', cell: (row) => row.sku },
    { header: 'name', cell: (row) => row.name },
    { header: 'category', cell: (row) => row.category_name },
    { header: 'unit', cell: (row) => row.base_unit_name },
    { header: 'retail', cell: (row) => row.retail_price ?? '—' },
  ];

  return (
    <main className="mx-auto max-w-[960px] px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#d5dcff]">products</h1>
        <div className="flex gap-3">
          <button onClick={resetSrNo} className="text-sm text-[#737aa2] hover:text-[#c0caf5]">
            reset sr no
          </button>
          <Button onClick={openCreate}>+ new</Button>
        </div>
      </div>

      {showForm && (
        <ProductForm
          initial={editing ? draftFrom(editing) : EMPTY}
          isEdit={Boolean(editing)}
          categories={categories}
          baseUnits={baseUnits}
          onSubmit={submit}
          onCancel={() => setShowForm(false)}
          onCategoryCreated={async () => {
            await loadCategories();
          }}
          onBaseUnitCreated={async () => {
            await loadBaseUnits();
          }}
        />
      )}

      <EntityTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        onEdit={openEdit}
        onDelete={remove}
        empty="no products yet."
      />
    </main>
  );
}
```

- [ ] **Step 3: Verify typecheck, lint, and runtime**

Run:

```bash
npm run typecheck && npm run lint
npm run dev &
sleep 6
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/dashboard/products
kill %1
```

Expected: typecheck/lint pass; route responds. Then in the browser: create a product selecting an existing category and unit; use "+ new category" inline and confirm the new category is created, added to the dropdown, and auto-selected; save; confirm the product appears with its Sr No; edit it; delete it; click "reset sr no" and confirm the next created product starts at Sr No 1.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/master/product-form.tsx app/dashboard/products
git commit -m "Add products management page with inline quick-create"
```

---

## Self-Review Notes

- **Spec coverage:** stores/categories/base-units/products schema (Task 1); full CRUD APIs (Tasks 2–5); Master menu with three masters + separate Products link (Task 7); list + create/edit/delete pages (Tasks 8–10); store default rules — warehouse-only, single-default, auto sole warehouse (Tasks 1, 4); Sr No auto-increment + reset (Tasks 1, 5, 10); inline quick-create of category/base unit from product form (Task 10); no-zero-default / text-input-only numeric rule (Task 6 fields, all forms). Deleting an in-use category/base unit blocked with 409 (Task 2).
- **Type consistency:** `SimpleTable` values (`categories`, `base_units`) match the DB table names and the `TABLES` map; `StoreRow`/`StoreDraft` field names match the stores SQL columns; `ProductDraft` keys match the products POST/PATCH body fields and the SQL columns; `parseMoney` and `ensureSoleWarehouseDefault` are defined once and imported where reused.
- **Placeholder scan:** no TBD/TODO; every code step contains complete code; verification steps use `npm run typecheck`/`npm run lint` and concrete curl/browser checks (no test runner in repo).
