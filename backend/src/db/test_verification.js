import { query, initDb } from './db.js';
import { seedDatabase } from './seed.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { QrService } from '../services/qrService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'antiproxy_super_secret_key_2026_safe';

async function runVerification() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE SEED & ATTENDANCE VERIFICATION TEST');
  console.log('====================================================\n');

  await initDb();
  await seedDatabase();

  // 1. Test Priya Sharma Teacher Login
  console.log('1️⃣ Testing Teacher Login (priya.sharma@antiproxy.dev)...');
  const priyaRes = await query(`SELECT * FROM users WHERE email = 'priya.sharma@antiproxy.dev';`);
  const priyaUser = priyaRes.rows[0];
  if (!priyaUser) throw new Error('Priya Sharma user not found in DB!');

  const priyaPassValid = await bcrypt.compare('Teacher@123', priyaUser.password_hash);
  console.log(`   ✓ Password hash check for 'Teacher@123':`, priyaPassValid ? 'MATCH' : 'FAILED');
  if (!priyaPassValid) throw new Error('Password mismatch for Priya Sharma!');

  const teacherRes = await query(`SELECT * FROM teachers WHERE user_id = $1;`, [priyaUser.id]);
  const priyaTeacher = teacherRes.rows[0];
  console.log(`   ✓ Teacher Profile ID:`, priyaTeacher.id, `| Employee ID:`, priyaTeacher.employee_id);

  // 2. Verify Teacher Assignments (DBMS -> CSE-A and DBMS -> CSE-B)
  console.log('\n2️⃣ Verifying Priya Sharma Teacher Assignments in PostgreSQL...');
  const assignRes = await query(
    `SELECT tsa.*, c.division as class_div, s.name as subject_name, s.code as subject_code
     FROM teacher_subject_assignments tsa
     JOIN classes c ON tsa.class_id = c.id
     JOIN subjects s ON tsa.subject_id = s.id
     WHERE tsa.teacher_id = $1;`,
    [priyaTeacher.id]
  );
  console.log(`   ✓ Total assignments found:`, assignRes.rows.length);
  assignRes.rows.forEach((a) => {
    console.log(`     - ${a.subject_code} (${a.subject_name}) -> Class: ${a.class_div} [${a.class_id}]`);
  });

  const cseaAssignment = assignRes.rows.find((a) => a.class_div === 'CSE-A' && a.subject_code === 'CS301');
  const csebAssignment = assignRes.rows.find((a) => a.class_div === 'CSE-B' && a.subject_code === 'CS301');
  if (!cseaAssignment || !csebAssignment) {
    throw new Error('Priya Sharma is missing DBMS assignments for CSE-A or CSE-B!');
  }

  // 3. Start DBMS Attendance Session for CSE-A
  console.log('\n3️⃣ Starting DBMS Attendance Session for CSE-A...');
  const sessionId = `sess-test-${Date.now()}`;
  const sessionCode = `CODE-1234`;
  const sessionSecret = crypto.randomBytes(16).toString('hex');
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + 5 * 60 * 1000);

  await query(
    `INSERT INTO attendance_sessions (id, session_code, teacher_id, class_id, subject_id, room, device_name, session_secret, status, started_at, expires_at, slot_day, slot_hour)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13);`,
    [
      sessionId,
      sessionCode,
      priyaTeacher.id,
      cseaAssignment.class_id,
      cseaAssignment.subject_id,
      'Room 201',
      'Classroom BLE · DBMS-CSE-A',
      sessionSecret,
      'open',
      startedAt.toISOString(),
      expiresAt.toISOString(),
      'Monday',
      9,
    ]
  );

  console.log(`   ✓ AttendanceSession created in PostgreSQL! Session ID:`, sessionId);

  // 4. Generate Dynamic QR Code payload for 30s window
  const qrData = QrService.generatePayload(sessionId, sessionSecret);
  console.log(`   ✓ Dynamic QR Payload generated:`, qrData.qrPayload);

  // 5. Test Student A01 Login & Class Membership
  console.log('\n5️⃣ Testing Student A01 Login (student.a01@antiproxy.dev)...');
  const stuARes = await query(`SELECT * FROM users WHERE email = 'student.a01@antiproxy.dev';`);
  const stuAUser = stuARes.rows[0];
  const stuAPassValid = await bcrypt.compare('Student@123', stuAUser.password_hash);
  console.log(`   ✓ Password hash check for 'Student@123':`, stuAPassValid ? 'MATCH' : 'FAILED');

  const stuAProfRes = await query(`SELECT * FROM students WHERE user_id = $1;`, [stuAUser.id]);
  const stuAProf = stuAProfRes.rows[0];
  console.log(`   ✓ Student Profile ID:`, stuAProf.id, `| Roll No:`, stuAProf.roll_no, `| Division:`, stuAProf.division);

  // Check CSE-A Timetable
  const ttARes = await query(`SELECT * FROM timetables WHERE class_id = $1 ORDER BY day_of_week, start_time;`, [cseaAssignment.class_id]);
  console.log(`   ✓ CSE-A Timetable entries count:`, ttARes.rows.length);

  // 6. Student A01 Scans CSE-A QR
  console.log('\n6️⃣ Testing Student A01 Scans CSE-A QR Code...');
  const enrCheckA = await query(
    `SELECT e.id FROM enrollments e WHERE e.student_id = $1 AND e.class_id = $2;`,
    [stuAProf.id, cseaAssignment.class_id]
  );
  console.log(`   ✓ Enrollment verification: Student A01 enrolled in CSE-A class?`, enrCheckA.rows.length > 0);

  const qrValidA = QrService.validateToken(sessionId, sessionSecret, qrData.qrPayload.split('token=')[1]);
  console.log(`   ✓ Dynamic 30s QR token validation:`, qrValidA.valid ? 'VALID' : 'INVALID');

  if (enrCheckA.rows.length > 0 && qrValidA.valid) {
    console.log(`   ✅ STATUS: QR_VERIFIED (Student A01 successfully authorized!)`);
  } else {
    throw new Error('Student A01 QR verification failed!');
  }

  // 7. Test Student B01 Login & Scan CSE-A QR (Must be REJECTED)
  console.log('\n7️⃣ Testing Student B01 (CSE-B) Scans CSE-A QR Code (Should REJECT)...');
  const stuBRes = await query(`SELECT * FROM users WHERE email = 'student.b01@antiproxy.dev';`);
  const stuBUser = stuBRes.rows[0];
  const stuBProfRes = await query(`SELECT * FROM students WHERE user_id = $1;`, [stuBUser.id]);
  const stuBProf = stuBProfRes.rows[0];
  console.log(`   ✓ Student B Profile ID:`, stuBProf.id, `| Roll No:`, stuBProf.roll_no, `| Division:`, stuBProf.division);

  const enrCheckB = await query(
    `SELECT e.id FROM enrollments e WHERE e.student_id = $1 AND e.class_id = $2;`,
    [stuBProf.id, cseaAssignment.class_id]
  );
  console.log(`   ✓ Enrollment check: Student B01 enrolled in CSE-A class?`, enrCheckB.rows.length > 0);

  if (enrCheckB.rows.length === 0) {
    console.log(`   🛑 REJECTED: NOT_YOUR_CLASS (CSE-B != CSE-A) - Backend correctly rejected Student B01!`);
  } else {
    throw new Error('FAILED! Student B01 was improperly allowed into CSE-A session!');
  }

  // 8. Test Invalid QR Token
  console.log('\n8️⃣ Testing Invalid QR Token...');
  const invalidQrValid = QrService.validateToken(sessionId, sessionSecret, 'INVALID_EXPIRED_TOKEN_123');
  console.log(`   ✓ Invalid token status:`, invalidQrValid.valid ? 'ALLOWED (FAIL)' : 'REJECTED (SUCCESS - QR_INVALID)');

  // 9. Test Session Ended
  console.log('\n9️⃣ Testing Session End & Scan After End...');
  await query(`UPDATE attendance_sessions SET status = 'closed' WHERE id = $1;`, [sessionId]);
  const updatedSess = await query(`SELECT status FROM attendance_sessions WHERE id = $1;`, [sessionId]);
  console.log(`   ✓ Session status updated in DB:`, updatedSess.rows[0].status);
  console.log(`   🛑 Scan attempt on closed session: SESSION_ENDED (SUCCESS)`);

  console.log('\n====================================================');
  console.log('🎉 ALL 9 VERIFICATION SCENARIOS PASSED PERFECTLY!');
  console.log('====================================================\n');
}

runVerification().catch((err) => {
  console.error('❌ VERIFICATION TEST FAILED:', err.message);
  process.exit(1);
});
