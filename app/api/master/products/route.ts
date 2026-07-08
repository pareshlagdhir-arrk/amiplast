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
