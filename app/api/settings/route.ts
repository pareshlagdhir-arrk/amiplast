import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ensureSchema } from '@/lib/schema';
import { DEFAULT_SETTINGS, type Settings } from '@/lib/settings';

export const runtime = 'nodejs';

export async function GET() {
  await ensureSchema();
  const result = await getPool().query<{ data: Settings }>(
    'SELECT data FROM settings WHERE id = 1'
  );
  const data = result.rows[0]?.data ?? DEFAULT_SETTINGS;
  return NextResponse.json({ settings: data });
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<Settings> | null;

  if (!body || typeof body.app !== 'object' || typeof body.company !== 'object') {
    return NextResponse.json({ message: 'Invalid settings payload' }, { status: 400 });
  }

  // Merge onto defaults so missing keys stay well-defined.
  const merged: Settings = {
    app: { ...DEFAULT_SETTINGS.app, ...body.app },
    company: { ...DEFAULT_SETTINGS.company, ...body.company },
  };

  await ensureSchema();
  const result = await getPool().query<{ data: Settings }>(
    `INSERT INTO settings (id, data) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
     RETURNING data`,
    [JSON.stringify(merged)]
  );

  return NextResponse.json({ settings: result.rows[0].data });
}
