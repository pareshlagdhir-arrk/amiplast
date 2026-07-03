import { Pool } from 'pg';

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export function getPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({ connectionString });
  }

  return globalForPg.pgPool;
}
