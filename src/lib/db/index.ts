// src/lib/db/index.ts
import { Pool, QueryResult, QueryResultRow } from 'pg';

declare global {
  // Mengelakkan sambungan pool berganda semasa hot-reload Next.js
  var _pgPool: Pool | undefined;
}

const pool = global._pgPool || new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

if (process.env.NODE_ENV !== 'production') {
  global._pgPool = pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('⚡ Query SQL:', { text: text.substring(0, 60), duration: `${duration}ms`, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('❌ Ralat Database SQL:', error);
    throw error;
  }
}

export default pool;