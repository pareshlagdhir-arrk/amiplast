import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function getKey() {
  const secret = process.env.JWT_SECRET;
  return secret ? new TextEncoder().encode(secret) : null;
}

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  const key = getKey();

  if (!token || !key) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    await jwtVerify(token, key);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*']
};
