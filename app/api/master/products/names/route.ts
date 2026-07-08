import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ensureSchema } from '@/lib/schema';

export const runtime = 'nodejs';

// Autocomplete source for the products name filter. Returns distinct names
// matching the query (prefix, case-insensitive), capped for responsiveness.
export async function GET(request: Request) {
  await ensureSchema();
  const q = (new URL(request.url).searchParams.get('q') ?? '').trim();
  if (!q) {
    return NextResponse.json({ names: [] });
  }

  const result = await getPool().query<{ name: string }>(
    `SELECT DISTINCT name FROM products WHERE name ILIKE $1 ORDER BY name LIMIT 10`,
    [`${q}%`]
  );

  return NextResponse.json({ names: result.rows.map((r) => r.name) });
}
