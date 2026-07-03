import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

function getKey() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  return new TextEncoder().encode(secret);
}

export type AuthTokenPayload = {
  sub: string;
  username: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createAuthToken(payload: AuthTokenPayload) {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(getKey());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getKey());
  return payload;
}
