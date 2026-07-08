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
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';

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
  const name = typeof body?.name === 'string' ? body.name.trim() : '';

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
