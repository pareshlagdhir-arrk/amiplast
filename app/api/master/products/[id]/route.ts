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
