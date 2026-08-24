import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:vjti@123@localhost:5432/antiproxy'
});

async function main() {
  const res = await pool.query(`
    SELECT s.id, s.status, s.expires_at, s.started_at, sub.name as sub_name, u.name as tch_name
    FROM attendance_sessions s
    LEFT JOIN subjects sub ON s.subject_id = sub.id
    LEFT JOIN teachers t ON s.teacher_id = t.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE s.status IN ('ACTIVE', 'open', 'OPEN');
  `);
  console.log('Active Sessions in PostgreSQL:', res.rows);

  const updateRes = await pool.query(`
    UPDATE attendance_sessions 
    SET status = 'EXPIRED' 
    WHERE status IN ('ACTIVE', 'open', 'OPEN');
  `);
  console.log('Expired old active sessions count:', updateRes.rowCount);
  await pool.end();
  process.exit(0);
}

main().catch(console.error);
