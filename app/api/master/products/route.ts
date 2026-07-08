import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { isForeignKeyViolation } from '@/lib/master/simple-entity';

export const runtime = 'nodejs';

export type ProductRow = {
  id: string;
  sr_no: number;
  sku: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  base_unit_id: string | null;
  purchase_price: string | null;
  retail_price: string | null;
  wholesale_price: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductListRow = ProductRow & {
  category_name: string | null;
  base_unit_name: string | null;
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

// Whitelist of sortable columns → safe SQL expressions (never interpolate
// user input into the ORDER BY clause).
const SORT_COLUMNS: Record<string, string> = {
  sr_no: 'p.sr_no',
  name: 'lower(p.name)',
  category_name: 'lower(c.name)',
  base_unit_name: 'lower(u.name)',
  purchase_price: 'p.purchase_price',
  retail_price: 'p.retail_price',
  wholesale_price: 'p.wholesale_price',
  created_at: 'p.created_at',
};

const SELECT_COLS = `p.id, p.sr_no, p.sku, p.name, p.description, p.category_id, p.base_unit_id,
       p.purchase_price, p.retail_price, p.wholesale_price, p.created_at, p.updated_at,
       c.name AS category_name, u.name AS base_unit_name`;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const pageSizeRaw = Number(url.searchParams.get('pageSize')) || 20;
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
  const sortKey = url.searchParams.get('sort') ?? 'sr_no';
  const sortExpr = SORT_COLUMNS[sortKey] ?? SORT_COLUMNS.sr_no;
  const dir = url.searchParams.get('dir') === 'desc' ? 'DESC' : 'ASC';
  const name = (url.searchParams.get('name') ?? '').trim();

  const where: string[] = [];
  const params: unknown[] = [];
  if (name) {
    params.push(`%${name}%`);
    where.push(`p.name ILIKE $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const pool = getPool();
  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM products p ${whereSql}`,
    params
  );
  const total = Number(countResult.rows[0].total);

  const offset = (page - 1) * pageSize;
  const listParams = [...params, pageSize, offset];
  const listResult = await pool.query<ProductListRow>(
    `SELECT ${SELECT_COLS}
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN base_units u ON u.id = p.base_unit_id
       ${whereSql}
      ORDER BY ${sortExpr} ${dir}, p.sr_no ASC
      LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  return NextResponse.json({ items: listResult.rows, total, page, pageSize });
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

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const sku = (typeof body?.sku === 'string' ? body.sku.trim() : '') || null;
  const description = (typeof body?.description === 'string' ? body.description.trim() : '') || null;
  const categoryId = (typeof body?.category_id === 'string' ? body.category_id.trim() : '') || null;
  const baseUnitId = (typeof body?.base_unit_id === 'string' ? body.base_unit_id.trim() : '') || null;

  if (!name) {
    return NextResponse.json({ message: 'Name is required' }, { status: 400 });
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

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO products
         (sr_no, sku, name, description, category_id, base_unit_id,
          purchase_price, retail_price, wholesale_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [srNo, sku, name, description, categoryId, baseUnitId, purchase.value, retail.value, wholesale.value]
    );

    // Return the row with joined category/unit names so it can render at once.
    const result = await client.query<ProductListRow>(
      `SELECT ${SELECT_COLS}
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN base_units u ON u.id = p.base_unit_id
        WHERE p.id = $1`,
      [inserted.rows[0].id]
    );

    await client.query('COMMIT');
    return NextResponse.json({ item: result.rows[0] }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    if (isForeignKeyViolation(error)) {
      return NextResponse.json({ message: 'Category or base unit does not exist' }, { status: 400 });
    }
    throw error;
  } finally {
    client.release();
  }
}
