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

  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const type = typeof body?.type === 'string' ? body.type.trim() : '';
  const address = (typeof body?.address === 'string' ? body.address.trim() : '') || null;
  const phone = (typeof body?.phone === 'string' ? body.phone.trim() : '') || null;
  let isDefault = typeof body?.is_default === 'boolean' ? body.is_default : false;

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
