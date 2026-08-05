import mysql from 'mysql2/promise';
import { config } from '../config/environment.js';

const ssl = config.DB_SSL
  ? { rejectUnauthorized: true }
  : false;

export const pool = mysql.createPool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  connectTimeout: 10000,
});

export async function checkDatabaseConnection(overridePool) {
  const conn = await (overridePool || pool).getConnection();
  try {
    await conn.execute('SELECT 1 AS connection_test;');
    return true;
  } finally {
    conn.release();
  }
}
