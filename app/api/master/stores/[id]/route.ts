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

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const type = typeof body?.type === 'string' ? body.type.trim() : '';
  const address = (typeof body?.address === 'string' ? body.address.trim() : '') || null;
  const phone = (typeof body?.phone === 'string' ? body.phone.trim() : '') || null;
  const isDefaultExplicit = typeof body?.is_default === 'boolean' ? body.is_default : null;

  if (!name || !type) {
    return NextResponse.json({ message: 'Name and type are required' }, { status: 400 });
  }
  if (!STORE_TYPES.includes(type as StoreType)) {
    return NextResponse.json({ message: 'Invalid store type' }, { status: 400 });
  }
  if (isDefaultExplicit === true && type !== 'warehouse') {
    return NextResponse.json(
      { message: 'Only a warehouse can be the default store' },
      { status: 400 }
    );
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const currentResult = await client.query<{ is_default: boolean }>(
      'SELECT is_default FROM stores WHERE id = $1',
      [id]
    );
    if (currentResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const effectiveDefault =
      isDefaultExplicit !== null ? isDefaultExplicit : currentResult.rows[0].is_default;
    const isDefault = type === 'warehouse' ? effectiveDefault : false;

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
