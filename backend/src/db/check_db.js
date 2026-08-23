import { query, initDb } from './db.js';

async function checkDatabase() {
  console.log('====================================================');
  console.log('📊 ANTIPROXY POSTGRESQL DATABASE INSPECTOR');
  console.log('====================================================\n');

  await initDb();

  // 1. List all tables and row counts
  console.log('📌 1. TABLES & ROW COUNTS IN `antiproxy` DATABASE:');
  const tables = [
    'users',
    'departments',
    'teachers',
    'students',
    'hods',
    'classes',
    'subjects',
    'teacher_subject_assignments',
    'enrollments',
    'registered_devices',
    'timetables',
    'attendance_sessions',
  ];

  for (const table of tables) {
    try {
      const res = await query(`SELECT COUNT(*) FROM ${table};`);
      console.log(`  - ${table.padEnd(30)} : ${res.rows[0].count} rows`);
    } catch (e) {
      console.log(`  - ${table.padEnd(30)} : [Table empty or not created]`);
    }
  }

  // 2. Sample Users
  console.log('\n👥 2. SAMPLE USER ACCOUNTS (Role, Email, Name):');
  const userRes = await query(`SELECT role, email, name FROM users ORDER BY role, email LIMIT 10;`);
  userRes.rows.forEach((r) => {
    console.log(`  - [${r.role.toUpperCase().padEnd(7)}] ${r.email.padEnd(32)} (${r.name})`);
  });

  // 3. Sample Divisions & Classes
  console.log('\n🏫 3. CLASSES & DIVISIONS:');
  const classRes = await query(`SELECT id, code, name, division FROM classes;`);
  classRes.rows.forEach((c) => {
    console.log(`  - ID: ${c.id.padEnd(12)} | Code: ${c.code.padEnd(6)} | Division: ${c.division.padEnd(6)} | Name: ${c.name}`);
  });

  // 4. Sample Teacher Assignments
  console.log('\n👩‍🏫 4. TEACHER SUBJECT ASSIGNMENTS (PostgreSQL Joins):');
  const assignRes = await query(
    `SELECT u.name as teacher_name, s.code as subject_code, s.name as subject_name, c.division
     FROM teacher_subject_assignments tsa
     JOIN teachers t ON tsa.teacher_id = t.id
     JOIN users u ON t.user_id = u.id
     JOIN subjects s ON tsa.subject_id = s.id
     JOIN classes c ON tsa.class_id = c.id
     ORDER BY u.name, c.division;`
  );
  assignRes.rows.forEach((a) => {
    console.log(`  - ${a.teacher_name.padEnd(16)} ──► ${a.subject_code} (${a.subject_name}) for Section ${a.division}`);
  });

  // 5. Sample Student Enrollments Summary
  console.log('\n🎓 5. STUDENT ENROLLMENTS SUMMARY:');
  const enrRes = await query(
    `SELECT c.division, COUNT(e.id) as total_students
     FROM enrollments e
     JOIN classes c ON e.class_id = c.id
     GROUP BY c.division
     ORDER BY c.division;`
  );
  enrRes.rows.forEach((e) => {
    console.log(`  - Division ${e.division} : ${e.total_students} enrolled students`);
  });

  console.log('\n====================================================');
  console.log('✅ DATABASE INSPECTION COMPLETED SUCCESSFULLY');
  console.log('====================================================\n');
  process.exit(0);
}

checkDatabase().catch((err) => {
  console.error('Error checking database:', err.message);
  process.exit(1);
});
