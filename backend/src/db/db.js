import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let pool = null;
let usePg = false;

// Memory DB storage fallback
const memoryDb = {
  users: [],
  students: [],
  teachers: [],
  hods: [],
  admins: [],
  departments: [],
  classes: [],
  subjects: [],
  enrollments: [],
  registered_devices: [],
  attendance_sessions: [],
  attendance_attempts: [],
  attendance_records: [],
  verification_logs: [],
  attendance_rules: [],
  risk_scores: [],
  notifications: []
};

// Try connecting to PostgreSQL
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/antiproxy';

export async function initDb() {
  try {
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 3000,
    });
    
    // Test connection
    const client = await pool.connect();
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);
    client.release();
    usePg = true;
    console.log('✅ Connected to PostgreSQL database & initialized schema.');
  } catch (err) {
    console.warn('⚠️  PostgreSQL connection failed or unavailable:', err.message);
    console.log('⚡ Using resilient in-memory database store with seed fallback.');
    usePg = false;
  }
}

export function isPg() {
  return usePg;
}

export function getMemoryDb() {
  return memoryDb;
}

export async function query(sql, params = []) {
  if (usePg && pool) {
    try {
      const res = await pool.query(sql, params);
      return res;
    } catch (err) {
      console.error('Database query error:', err.message);
      throw err;
    }
  }
  return { rows: [] };
}
