import pg from 'pg';

const { Pool } = pg;

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export async function query(text, params) {
  if (pool) {
    return pool.query(text, params);
  }
  const isSelect = text.trim().toUpperCase().startsWith('SELECT');
  return Promise.resolve({
    rows: [],
    rowCount: isSelect ? 0 : 1
  });
}

export function getPool() {
  return pool;
}

export function isMockDb() {
  return !pool;
}
