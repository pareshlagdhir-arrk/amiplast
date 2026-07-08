import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST() {
  await getPool().query("UPDATE counters SET value = 1 WHERE key = 'product_sr_no'");
  return NextResponse.json({ ok: true });
}
