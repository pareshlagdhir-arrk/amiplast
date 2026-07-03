import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAuthToken, verifyPassword } from '@/lib/auth';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

type UserRow = {
  id: string;
  username: string;
  password_hash: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { username?: string; password?: string } | null;
  const username = body?.username?.trim();
  const password = body?.password;

  if (!username || !password) {
    return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
  }

  const result = await getPool().query<UserRow>(
    'SELECT id, username, password_hash FROM users WHERE username = $1 LIMIT 1',
    [username]
  );
  const user = result.rows[0];

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
  }

  const token = await createAuthToken({ sub: user.id, username: user.username });

  const cookieStore = await cookies();

  cookieStore.set('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 2,
    path: '/'
  });

  return NextResponse.json({ user: { id: user.id, username: user.username } });
}
