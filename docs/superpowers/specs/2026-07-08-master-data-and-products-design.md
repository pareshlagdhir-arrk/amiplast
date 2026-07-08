# Master Data and Products — Design

Date: 2026-07-08

## Overview

Add master-data management and product management to the Amiplast dashboard. The
feature introduces four persisted entities — Stores, Categories, Base Units, and
Products — each with full list, create, edit, and delete support. Stores,
Categories, and Base Units are reachable from a new **Master** dropdown in the
header. Products are reachable from a separate top-level **Products** header link.

## Goals

- Persist all four entities in Postgres, following the existing auth pattern
  (client components calling REST API routes backed by `lib/db.ts`).
- Provide full list plus create, edit, and delete per entity.
- Enforce the store default rule at the database level.
- Allow inline quick-create of a Category and a Base Unit from within the Product
  form.
- Match the existing Tokyo Night terminal aesthetic (JetBrains Mono, lowercase
  labels, `#1a1b26` / `#202331` surfaces, `#7aa2f7` accent).

## Non-Goals

- Purchase, sales, or any transactional flows. The store default flag is defined
  and enforced here, but the transactions that consume it are out of scope.
- Authentication or authorization changes. Existing middleware/session handling
  is reused as-is.
- Pagination, search, or bulk import. Lists render all rows for now.

## Approach

Client components fetch from and mutate through REST API routes, mirroring
`app/api/auth/*`. This keeps a clean separation and is consistent with the
established codebase pattern. Server Actions and client-only local state were
considered and rejected: the former diverges from the existing pattern, the
latter fails the persistence requirement.

## Data Model

New migration file: `db/init/003_master_data.sql`. The `db/init` directory is
mounted into the Postgres container and executed only on a fresh data volume
(see `docker-compose.yml`). The spec therefore requires the file be written so it
can also be applied manually against an existing database (idempotent
`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).

### `stores`

| Column      | Type          | Notes                                             |
|-------------|---------------|---------------------------------------------------|
| id          | TEXT PK       | User-entered unique code (e.g. `WH01`).           |
| name        | TEXT NOT NULL |                                                   |
| address     | TEXT          |                                                   |
| phone       | TEXT          |                                                   |
| type        | TEXT NOT NULL | CHECK in (`warehouse`,`showroom`,`outlet`,`other`).|
| is_default  | BOOLEAN NOT NULL DEFAULT FALSE |                                  |
| created_at  | TIMESTAMPTZ   | DEFAULT NOW()                                     |
| updated_at  | TIMESTAMPTZ   | DEFAULT NOW()                                     |

Constraints:

- `CHECK (NOT is_default OR type = 'warehouse')` — only a warehouse may be the
  default.
- `CREATE UNIQUE INDEX ... ON stores (is_default) WHERE is_default` — at most one
  default store at any time.

### `categories` and `base_units`

Both share the same shape:

| Column     | Type          | Notes                              |
|------------|---------------|------------------------------------|
| id         | TEXT PK       | User-entered unique code.          |
| name       | TEXT NOT NULL |                                    |
| created_at | TIMESTAMPTZ   | DEFAULT NOW()                      |
| updated_at | TIMESTAMPTZ   | DEFAULT NOW()                      |

### `products`

| Column          | Type          | Notes                                         |
|-----------------|---------------|-----------------------------------------------|
| id              | UUID PK       | System identifier, DEFAULT gen_random_uuid(). |
| sr_no           | INTEGER NOT NULL | Assigned from the counter on create.       |
| sku             | TEXT NOT NULL UNIQUE |                                        |
| name            | TEXT NOT NULL |                                               |
| description     | TEXT          |                                               |
| category_id     | TEXT NOT NULL REFERENCES categories(id) |                     |
| base_unit_id    | TEXT NOT NULL REFERENCES base_units(id) |                     |
| purchase_price  | NUMERIC(14,2) |                                               |
| retail_price    | NUMERIC(14,2) |                                               |
| wholesale_price | NUMERIC(14,2) |                                               |
| created_at      | TIMESTAMPTZ   | DEFAULT NOW()                                 |
| updated_at      | TIMESTAMPTZ   | DEFAULT NOW()                                 |

### `counters`

Holds resettable sequence values.

| Column | Type    | Notes                                    |
|--------|---------|------------------------------------------|
| key    | TEXT PK | e.g. `product_sr_no`.                    |
| value  | INTEGER NOT NULL | Next value to assign.           |

Seeded with `('product_sr_no', 1)`.

## API Routes

All under `app/api/master/`. Each route runs on the Node.js runtime and uses
`getPool()`. JSON request/response, HTTP status codes consistent with the auth
routes (400 for validation, 409 for unique conflicts, 404 for missing records).

### Stores

- `GET /api/master/stores` — list all stores.
- `POST /api/master/stores` — create. Runs in a transaction: if the new store is
  a warehouse and it is the only warehouse, it is set default automatically; if
  it is explicitly marked default, any other default is cleared first. Non-
  warehouse types may never be default.
- `PATCH /api/master/stores/[id]` — update. Same default reconciliation as POST.
- `DELETE /api/master/stores/[id]` — delete.

### Categories and Base Units

- `GET /api/master/categories`, `POST /api/master/categories`.
- `PATCH /api/master/categories/[id]`, `DELETE /api/master/categories/[id]`.
- Identical set for `base-units`.
- Unique-code violations return 409.

### Products

- `GET /api/master/products` — list, joined to category and base-unit names for
  display.
- `POST /api/master/products` — create. In a transaction, reads and increments
  `counters.product_sr_no`, assigns the read value as `sr_no`.
- `PATCH /api/master/products/[id]`, `DELETE /api/master/products/[id]`.
- `POST /api/master/products/reset-sr` — set `counters.product_sr_no` back to 1.

## Navigation

`components/dashboard/header.tsx` gains:

- A **Master** dropdown button with an icon, following the existing
  `ProfileMenu` open/close/backdrop pattern, listing **Stores**, **Categories**,
  and **Base Units**.
- A separate top-level **Products** link.

## Pages

- `app/dashboard/master/stores/page.tsx`
- `app/dashboard/master/categories/page.tsx`
- `app/dashboard/master/base-units/page.tsx`
- `app/dashboard/products/page.tsx`

## UI Pattern

Each page is a client component that fetches its list on mount, renders a table
of existing records with per-row **edit** and **delete** actions, and toggles an
**inline create/edit form panel** above the list. No modal primitive is
introduced. Styling reuses the field/label/select patterns already present in
`components/dashboard/settings/*` and the `components/ui` primitives.

### Form input rules (from requirements)

- Every text field defaults to empty. No field is pre-filled with `0`.
- All numeric values (prices) use plain text inputs with validation on submit —
  never number spinner inputs.

### Product form inline quick-create

The Category and Base Unit selects each include a "+ new" affordance. Choosing it
reveals a small inline sub-form (code + name); on submit it calls the respective
`POST` route, then adds the new record to the select options and selects it,
without leaving the Product form.

### Products page controls

A **reset Sr No** control calls `POST /api/master/products/reset-sr` after a
confirmation, then refreshes the list.

## Error Handling

- API routes validate required fields and return 400 with a message on failure.
- Unique-constraint violations (store/category/unit code, product SKU) return 409
  with a clear message; the form surfaces it inline.
- Foreign-key violations on product create/update (missing category or unit)
  return 400.
- Delete of a category or base unit still referenced by a product is blocked by
  the FK; the API returns 409 with a message explaining the record is in use.

## Testing

- Manual verification of each screen: create, edit, delete, and list refresh.
- Store default rule: creating a sole warehouse auto-defaults it; adding a second
  warehouse does not change the default; marking the second default clears the
  first; a non-warehouse type cannot be set default.
- Product Sr No increments on create and resets to 1 via the reset control.
- Inline quick-create of a category and base unit from the Product form.

## Open Items

None outstanding. Store types start as `warehouse`, `showroom`, `outlet`,
`other` and are extendable by editing the `CHECK` constraint.
