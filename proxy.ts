import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function getKey() {
  const secret = process.env.JWT_SECRET;
  return secret ? new TextEncoder().encode(secret) : null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/master') ||
    pathname.startsWith('/api/settings');

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  const key = getKey();

  const unauthorized = () => {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  };

  if (!token || !key) {
    return unauthorized();
  }

  try {
    await jwtVerify(token, key);
    return NextResponse.next();
  } catch {
    return unauthorized();
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/master/:path*', '/api/settings', '/api/settings/:path*']
};
