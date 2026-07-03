import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await verifyAuthToken(token);
    return NextResponse.json({ user: { id: payload.sub, username: payload.username } });
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}
