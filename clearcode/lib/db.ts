import { Pool } from "pg";

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) {
  const result = await getPool().query<T>(text, params);
  return result;
}
