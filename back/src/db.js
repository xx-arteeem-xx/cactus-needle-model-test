import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 8 });

export async function query(text, params) {
  return pool.query(text, params);
}

export async function ping() {
  await pool.query('SELECT 1');
}
