import { hashPassword } from '../lib/auth';
import { getPool } from '../lib/db';

async function main() {
  const username = process.env.SEED_USERNAME;
  const password = process.env.SEED_PASSWORD;

  if (!username || !password) {
    throw new Error('SEED_USERNAME and SEED_PASSWORD are required');
  }

  const pool = getPool();
  const passwordHash = await hashPassword(password);

  await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username)
     DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
    [username, passwordHash]
  );

  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await getPool().end();
  process.exit(1);
});
