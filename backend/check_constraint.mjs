import pg from 'pg';

const pool = new pg.Pool({
  user: 'postgres',
  password: 'vjti@123',
  host: 'localhost',
  port: 5432,
  database: 'antiproxy',
});

try {
  // Drop old constraint and add new one that accepts both cases
  await pool.query(`ALTER TABLE attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_status_check;`);
  await pool.query(`ALTER TABLE attendance_sessions ADD CONSTRAINT attendance_sessions_status_check CHECK (status IN ('ACTIVE', 'ENDED', 'EXPIRED', 'CLOSED', 'OPEN', 'active', 'ended', 'expired', 'closed', 'open'));`);
  console.log('✅ Updated attendance_sessions_status_check constraint');

  // Update existing rows from 'open' -> 'ACTIVE' etc
  await pool.query(`UPDATE attendance_sessions SET status = 'ACTIVE' WHERE status = 'open';`);
  await pool.query(`UPDATE attendance_sessions SET status = 'CLOSED' WHERE status = 'closed';`);
  await pool.query(`UPDATE attendance_sessions SET status = 'EXPIRED' WHERE status = 'expired';`);
  console.log('✅ Updated existing session statuses');

  // Verify
  const constraints = await pool.query(
    `SELECT con.conname, pg_get_constraintdef(con.oid) as def
     FROM pg_constraint con
     JOIN pg_class rel ON rel.oid = con.conrelid
     WHERE rel.relname = 'attendance_sessions' AND con.conname LIKE '%status%';`
  );
  console.log('\nNew constraint:', constraints.rows[0]?.def);

} catch (e) {
  console.error('Error:', e.message);
} finally {
  await pool.end();
}
