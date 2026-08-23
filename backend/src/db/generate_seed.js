import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const teacherHash = '$2a$10$SIz/66pcyWGyC6wg6ZHaXOqJRfxA7zCwHwmdvFztUH80p7PD3l7Z6';
const hodHash = '$2a$10$Ggt3tC4CKnBydlSVc2iHq.q5ws4XSVlCzf.zGjoAQv2kI/WhL8nVW';
const studentHash = '$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy';

const departments = [
  { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE' }
];

const classes = [
  { id: 'cls-cse-a', department_id: 'dept-cse', name: 'B.Tech Computer Science & Engineering - Div A', code: 'CSE-A', division: 'CSE-A', type: 'Lecture' },
  { id: 'cls-cse-b', department_id: 'dept-cse', name: 'B.Tech Computer Science & Engineering - Div B', code: 'CSE-B', division: 'CSE-B', type: 'Lecture' },
  { id: 'cls-cse-c', department_id: 'dept-cse', name: 'B.Tech Computer Science & Engineering - Div C', code: 'CSE-C', division: 'CSE-C', type: 'Lecture' },
];

const subjects = [
  { id: 'sub-cs301', code: 'CS301', name: 'Database Management Systems', teacher_id: 'tch-t001', division: 'CSE-A' },
  { id: 'sub-cs302', code: 'CS302', name: 'Operating Systems', teacher_id: 'tch-t002', division: 'CSE-A' },
  { id: 'sub-cs303', code: 'CS303', name: 'Computer Networks', teacher_id: 'tch-t003', division: 'CSE-B' },
  { id: 'sub-cs304', code: 'CS304', name: 'Software Engineering', teacher_id: 'tch-t004', division: 'CSE-A' },
  { id: 'sub-cs305', code: 'CS305', name: 'Data Structures', teacher_id: 'tch-t001', division: 'CSE-A' },
];

const users = [
  // Teachers
  { id: 'usr-t001', email: 'priya.sharma@antiproxy.dev', password_hash: teacherHash, role: 'teacher', name: 'Priya Sharma' },
  { id: 'usr-t002', email: 'rahul.mehta@antiproxy.dev', password_hash: teacherHash, role: 'teacher', name: 'Rahul Mehta' },
  { id: 'usr-t003', email: 'ananya.rao@antiproxy.dev', password_hash: teacherHash, role: 'teacher', name: 'Ananya Rao' },
  { id: 'usr-t004', email: 'arjun.patel@antiproxy.dev', password_hash: teacherHash, role: 'teacher', name: 'Arjun Patel' },
  
  // HOD
  { id: 'usr-hod001', email: 'neha.kapoor@antiproxy.dev', password_hash: hodHash, role: 'hod', name: 'Dr. Neha Kapoor' },

  // Admin
  { id: 'usr-admin001', email: 'admin@antiproxy.dev', password_hash: teacherHash, role: 'admin', name: 'System Administrator' },
];

const teachers = [
  { id: 'tch-t001', user_id: 'usr-t001', department_id: 'dept-cse', designation: 'Assistant Professor', employee_id: 'T001', photo_url: 'https://randomuser.me/api/portraits/women/31.jpg' },
  { id: 'tch-t002', user_id: 'usr-t002', department_id: 'dept-cse', designation: 'Assistant Professor', employee_id: 'T002', photo_url: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 'tch-t003', user_id: 'usr-t003', department_id: 'dept-cse', designation: 'Assistant Professor', employee_id: 'T003', photo_url: 'https://randomuser.me/api/portraits/women/33.jpg' },
  { id: 'tch-t004', user_id: 'usr-t004', department_id: 'dept-cse', designation: 'Assistant Professor', employee_id: 'T004', photo_url: 'https://randomuser.me/api/portraits/men/34.jpg' },
];

const hods = [
  { id: 'hod-001', user_id: 'usr-hod001', department_id: 'dept-cse', designation: 'Head of Department', photo_url: 'https://randomuser.me/api/portraits/women/68.jpg' },
];

const admins = [
  { id: 'adm-001', user_id: 'usr-admin001', department_id: 'dept-cse' }
];

const teacher_subject_assignments = [
  { id: 'tsa-ps-dbms-csea', teacher_id: 'tch-t001', subject_id: 'sub-cs301', class_id: 'cls-cse-a' },
  { id: 'tsa-ps-dbms-cseb', teacher_id: 'tch-t001', subject_id: 'sub-cs301', class_id: 'cls-cse-b' },
  { id: 'tsa-ps-ds-csea', teacher_id: 'tch-t001', subject_id: 'sub-cs305', class_id: 'cls-cse-a' },
  { id: 'tsa-rm-os-csea', teacher_id: 'tch-t002', subject_id: 'sub-cs302', class_id: 'cls-cse-a' },
  { id: 'tsa-rm-os-csec', teacher_id: 'tch-t002', subject_id: 'sub-cs302', class_id: 'cls-cse-c' },
  { id: 'tsa-ar-cn-cseb', teacher_id: 'tch-t003', subject_id: 'sub-cs303', class_id: 'cls-cse-b' },
  { id: 'tsa-ar-cn-csec', teacher_id: 'tch-t003', subject_id: 'sub-cs303', class_id: 'cls-cse-c' },
  { id: 'tsa-ap-se-csea', teacher_id: 'tch-t004', subject_id: 'sub-cs304', class_id: 'cls-cse-a' },
  { id: 'tsa-ap-se-csec', teacher_id: 'tch-t004', subject_id: 'sub-cs304', class_id: 'cls-cse-c' },
];

const students = [];
const enrollments = [];
const registered_devices = [];

const divisions = [
  { prefix: 'a', classId: 'cls-cse-a', divName: 'CSE-A', rollPrefix: 'CSEA' },
  { prefix: 'b', classId: 'cls-cse-b', divName: 'CSE-B', rollPrefix: 'CSEB' },
  { prefix: 'c', classId: 'cls-cse-c', divName: 'CSE-C', rollPrefix: 'CSEC' },
];

divisions.forEach(div => {
  for (let i = 1; i <= 15; i++) {
    const numStr = String(i).padStart(2, '0');
    const userId = `usr-stu-${div.prefix}${numStr}`;
    const studentId = `stu-cse${div.prefix}-${numStr}`;
    const rollNo = `${div.rollPrefix}${numStr}`;
    const email = `student.${div.prefix}${numStr}@antiproxy.dev`;
    const name = `Student ${div.prefix.toUpperCase()}${numStr}`;
    const gender = (i % 2 === 0) ? 'women' : 'men';
    const photoUrl = `https://randomuser.me/api/portraits/${gender}/${(i * 3) % 90 + 10}.jpg`;

    users.push({
      id: userId,
      email,
      password_hash: studentHash,
      role: 'student',
      name
    });

    students.push({
      id: studentId,
      user_id: userId,
      roll_no: rollNo,
      division: div.divName,
      year: '3',
      programme: 'B.Tech Computer Science & Engineering',
      photo_url: photoUrl
    });

    enrollments.push({
      id: `enr-${div.prefix}-${numStr}`,
      student_id: studentId,
      class_id: div.classId
    });

    registered_devices.push({
      id: `dev-${div.prefix}-${numStr}`,
      student_id: studentId,
      device_name: `${name} Device`,
      device_identifier: `BLE-${rollNo}-DEV`,
      status: 'active'
    });
  }
});

const timetables = [
  // CSE-A Timetable
  { id: 'tt-csea-mon-1', class_id: 'cls-cse-a', teacher_id: 'tch-t001', subject_id: 'sub-cs301', day_of_week: 'Monday', start_time: '09:00:00', end_time: '10:00:00', room: 'Room 201' },
  { id: 'tt-csea-mon-2', class_id: 'cls-cse-a', teacher_id: 'tch-t002', subject_id: 'sub-cs302', day_of_week: 'Monday', start_time: '10:00:00', end_time: '11:00:00', room: 'Room 201' },
  { id: 'tt-csea-mon-3', class_id: 'cls-cse-a', teacher_id: 'tch-t004', subject_id: 'sub-cs304', day_of_week: 'Monday', start_time: '11:15:00', end_time: '12:15:00', room: 'Room 201' },
  { id: 'tt-csea-tue-2', class_id: 'cls-cse-a', teacher_id: 'tch-t001', subject_id: 'sub-cs301', day_of_week: 'Tuesday', start_time: '10:00:00', end_time: '11:00:00', room: 'Room 201' },
  { id: 'tt-csea-wed-1', class_id: 'cls-cse-a', teacher_id: 'tch-t002', subject_id: 'sub-cs302', day_of_week: 'Wednesday', start_time: '09:00:00', end_time: '10:00:00', room: 'Room 201' },
  { id: 'tt-csea-wed-2', class_id: 'cls-cse-a', teacher_id: 'tch-t001', subject_id: 'sub-cs305', day_of_week: 'Wednesday', start_time: '11:00:00', end_time: '12:00:00', room: 'Room 201' },
  { id: 'tt-csea-thu-1', class_id: 'cls-cse-a', teacher_id: 'tch-t001', subject_id: 'sub-cs301', day_of_week: 'Thursday', start_time: '10:00:00', end_time: '11:00:00', room: 'Room 201' },
  { id: 'tt-csea-thu-2', class_id: 'cls-cse-a', teacher_id: 'tch-t004', subject_id: 'sub-cs304', day_of_week: 'Thursday', start_time: '11:00:00', end_time: '12:00:00', room: 'Room 201' },
  { id: 'tt-csea-fri-1', class_id: 'cls-cse-a', teacher_id: 'tch-t002', subject_id: 'sub-cs302', day_of_week: 'Friday', start_time: '09:00:00', end_time: '10:00:00', room: 'Room 201' },

  // CSE-B Timetable
  { id: 'tt-cseb-mon-1', class_id: 'cls-cse-b', teacher_id: 'tch-t003', subject_id: 'sub-cs303', day_of_week: 'Monday', start_time: '09:00:00', end_time: '10:00:00', room: 'Room 202' },
  { id: 'tt-cseb-mon-2', class_id: 'cls-cse-b', teacher_id: 'tch-t001', subject_id: 'sub-cs301', day_of_week: 'Monday', start_time: '10:00:00', end_time: '11:00:00', room: 'Room 202' },
  { id: 'tt-cseb-tue-1', class_id: 'cls-cse-b', teacher_id: 'tch-t003', subject_id: 'sub-cs303', day_of_week: 'Tuesday', start_time: '09:00:00', end_time: '10:00:00', room: 'Room 202' },
  { id: 'tt-cseb-wed-1', class_id: 'cls-cse-b', teacher_id: 'tch-t001', subject_id: 'sub-cs301', day_of_week: 'Wednesday', start_time: '09:00:00', end_time: '10:00:00', room: 'Room 202' },
  { id: 'tt-cseb-wed-2', class_id: 'cls-cse-b', teacher_id: 'tch-t003', subject_id: 'sub-cs303', day_of_week: 'Wednesday', start_time: '11:00:00', end_time: '12:00:00', room: 'Room 202' },
  { id: 'tt-cseb-thu-1', class_id: 'cls-cse-b', teacher_id: 'tch-t001', subject_id: 'sub-cs301', day_of_week: 'Thursday', start_time: '09:00:00', end_time: '10:00:00', room: 'Room 202' },
  { id: 'tt-cseb-fri-1', class_id: 'cls-cse-b', teacher_id: 'tch-t003', subject_id: 'sub-cs303', day_of_week: 'Friday', start_time: '10:00:00', end_time: '11:00:00', room: 'Room 202' },

  // CSE-C Timetable
  { id: 'tt-csec-mon-1', class_id: 'cls-cse-c', teacher_id: 'tch-t002', subject_id: 'sub-cs302', day_of_week: 'Monday', start_time: '09:00:00', end_time: '10:00:00', room: 'Room 203' },
  { id: 'tt-csec-mon-2', class_id: 'cls-cse-c', teacher_id: 'tch-t003', subject_id: 'sub-cs303', day_of_week: 'Monday', start_time: '10:00:00', end_time: '11:00:00', room: 'Room 203' },
  { id: 'tt-csec-tue-1', class_id: 'cls-cse-c', teacher_id: 'tch-t004', subject_id: 'sub-cs304', day_of_week: 'Tuesday', start_time: '09:00:00', end_time: '10:00:00', room: 'Room 203' },
  { id: 'tt-csec-tue-2', class_id: 'cls-cse-c', teacher_id: 'tch-t002', subject_id: 'sub-cs302', day_of_week: 'Tuesday', start_time: '10:00:00', end_time: '11:00:00', room: 'Room 203' },
  { id: 'tt-csec-wed-1', class_id: 'cls-cse-c', teacher_id: 'tch-t003', subject_id: 'sub-cs303', day_of_week: 'Wednesday', start_time: '09:00:00', end_time: '10:00:00', room: 'Room 203' },
  { id: 'tt-csec-wed-2', class_id: 'cls-cse-c', teacher_id: 'tch-t004', subject_id: 'sub-cs304', day_of_week: 'Wednesday', start_time: '11:00:00', end_time: '12:00:00', room: 'Room 203' },
  { id: 'tt-csec-thu-1', class_id: 'cls-cse-c', teacher_id: 'tch-t002', subject_id: 'sub-cs302', day_of_week: 'Thursday', start_time: '09:00:00', end_time: '10:00:00', room: 'Room 203' },
  { id: 'tt-csec-fri-1', class_id: 'cls-cse-c', teacher_id: 'tch-t003', subject_id: 'sub-cs303', day_of_week: 'Friday', start_time: '09:00:00', end_time: '10:00:00', room: 'Room 203' },
  { id: 'tt-csec-fri-2', class_id: 'cls-cse-c', teacher_id: 'tch-t004', subject_id: 'sub-cs304', day_of_week: 'Friday', start_time: '10:00:00', end_time: '11:00:00', room: 'Room 203' },
];

const attendance_rules = [
  { id: 'rule-1', name: 'Low Attendance Warning', threshold_percent: 80.0, consecutive_absences: 2, action: 'STUDENT_WARNING', target_role: 'student', enabled: true },
  { id: 'rule-2', name: 'Defaulter Alert', threshold_percent: 75.0, consecutive_absences: 3, action: 'FACULTY_ALERT', target_role: 'teacher', enabled: true },
  { id: 'rule-3', name: 'Critical Escalation', threshold_percent: 70.0, consecutive_absences: 4, action: 'HOD_ESCALATION', target_role: 'hod', enabled: true },
];

const notifications = [
  { id: 'n1', user_id: 'usr-t001', role: 'teacher', title: 'Welcome Priya Sharma', body: 'DBMS & DS teacher assignments ready for CSE-A and CSE-B.', time_str: 'Today', unread: true },
  { id: 'n2', user_id: 'usr-hod001', role: 'hod', title: 'Department Seeded', body: 'CSE Department initialized with 3 divisions (A, B, C) and 45 students.', time_str: 'Today', unread: true },
];

// Generate SQL
let sql = `-- PostgreSQL Development Seed Data for AntiProxy
-- Auto-generated deterministic seed file

-- 1. DEPARTMENTS
`;

departments.forEach(d => {
  sql += `INSERT INTO departments (id, name, code) VALUES ('${d.id}', '${d.name}', '${d.code}') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;\n`;
});

sql += `\n-- 2. USERS\n`;
users.forEach(u => {
  sql += `INSERT INTO users (id, email, password_hash, role, name) VALUES ('${u.id}', '${u.email}', '${u.password_hash}', '${u.role}', '${u.name}') ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, name = EXCLUDED.name;\n`;
});

sql += `\n-- 3. TEACHERS, HODS, ADMINS, STUDENTS\n`;
teachers.forEach(t => {
  sql += `INSERT INTO teachers (id, user_id, department_id, designation, employee_id, photo_url) VALUES ('${t.id}', '${t.user_id}', '${t.department_id}', '${t.designation}', '${t.employee_id}', '${t.photo_url}') ON CONFLICT (id) DO UPDATE SET designation = EXCLUDED.designation, employee_id = EXCLUDED.employee_id;\n`;
});

hods.forEach(h => {
  sql += `INSERT INTO hods (id, user_id, department_id, designation, photo_url) VALUES ('${h.id}', '${h.user_id}', '${h.department_id}', '${h.designation}', '${h.photo_url}') ON CONFLICT (id) DO NOTHING;\n`;
});

admins.forEach(a => {
  sql += `INSERT INTO admins (id, user_id, department_id) VALUES ('${a.id}', '${a.user_id}', '${a.department_id}') ON CONFLICT (id) DO NOTHING;\n`;
});

students.forEach(s => {
  sql += `INSERT INTO students (id, user_id, roll_no, division, year, programme, photo_url) VALUES ('${s.id}', '${s.user_id}', '${s.roll_no}', '${s.division}', '${s.year}', '${s.programme}', '${s.photo_url}') ON CONFLICT (id) DO UPDATE SET roll_no = EXCLUDED.roll_no, division = EXCLUDED.division, year = EXCLUDED.year, programme = EXCLUDED.programme;\n`;
});

sql += `\n-- 4. CLASSES\n`;
classes.forEach(c => {
  sql += `INSERT INTO classes (id, department_id, name, code, division, type) VALUES ('${c.id}', '${c.department_id}', '${c.name}', '${c.code}', '${c.division}', '${c.type}') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, division = EXCLUDED.division;\n`;
});

sql += `\n-- 5. SUBJECTS\n`;
subjects.forEach(s => {
  sql += `INSERT INTO subjects (id, code, name, teacher_id, division) VALUES ('${s.id}', '${s.code}', '${s.name}', '${s.teacher_id}', '${s.division}') ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, teacher_id = EXCLUDED.teacher_id, division = EXCLUDED.division;\n`;
});

sql += `\n-- 6. TEACHER SUBJECT ASSIGNMENTS\n`;
teacher_subject_assignments.forEach(tsa => {
  sql += `INSERT INTO teacher_subject_assignments (id, teacher_id, subject_id, class_id) VALUES ('${tsa.id}', '${tsa.teacher_id}', '${tsa.subject_id}', '${tsa.class_id}') ON CONFLICT (id) DO UPDATE SET teacher_id = EXCLUDED.teacher_id, subject_id = EXCLUDED.subject_id, class_id = EXCLUDED.class_id;\n`;
});

sql += `\n-- 7. ENROLLMENTS & REGISTERED DEVICES\n`;
enrollments.forEach(e => {
  sql += `INSERT INTO enrollments (id, student_id, class_id) VALUES ('${e.id}', '${e.student_id}', '${e.class_id}') ON CONFLICT (id) DO NOTHING;\n`;
});

registered_devices.forEach(rd => {
  sql += `INSERT INTO registered_devices (id, student_id, device_name, device_identifier, status) VALUES ('${rd.id}', '${rd.student_id}', '${rd.device_name}', '${rd.device_identifier}', '${rd.status}') ON CONFLICT (id) DO NOTHING;\n`;
});

sql += `\n-- 8. TIMETABLES\n`;
timetables.forEach(tt => {
  sql += `INSERT INTO timetables (id, class_id, teacher_id, subject_id, day_of_week, start_time, end_time, room) VALUES ('${tt.id}', '${tt.class_id}', '${tt.teacher_id}', '${tt.subject_id}', '${tt.day_of_week}', '${tt.start_time}', '${tt.end_time}', '${tt.room}') ON CONFLICT (id) DO UPDATE SET day_of_week = EXCLUDED.day_of_week, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, room = EXCLUDED.room;\n`;
});

sql += `\n-- 9. ATTENDANCE RULES & NOTIFICATIONS\n`;
attendance_rules.forEach(r => {
  sql += `INSERT INTO attendance_rules (id, name, threshold_percent, consecutive_absences, action, target_role, enabled) VALUES ('${r.id}', '${r.name}', ${r.threshold_percent}, ${r.consecutive_absences}, '${r.action}', '${r.target_role}', ${r.enabled}) ON CONFLICT (id) DO NOTHING;\n`;
});

notifications.forEach(n => {
  sql += `INSERT INTO notifications (id, user_id, role, title, body, time_str, unread) VALUES ('${n.id}', '${n.user_id}', '${n.role}', '${n.title}', '${n.body}', '${n.time_str}', ${n.unread}) ON CONFLICT (id) DO NOTHING;\n`;
});

// Save seed.sql files
const backendSeedSqlPath = path.join(__dirname, 'seed.sql');
const projectDbDir = path.join(__dirname, '../../..', 'database');
if (!fs.existsSync(projectDbDir)) {
  fs.mkdirSync(projectDbDir, { recursive: true });
}
const databaseSeedSqlPath = path.join(projectDbDir, 'seed.sql');

fs.writeFileSync(backendSeedSqlPath, sql);
fs.writeFileSync(databaseSeedSqlPath, sql);

console.log('✅ Generated seed.sql at:', backendSeedSqlPath);
console.log('✅ Generated seed.sql at:', databaseSeedSqlPath);

// Generate seed.js object export
const seedDataObject = {
  users,
  departments,
  classes,
  subjects,
  teachers,
  hods,
  admins,
  teacher_subject_assignments,
  students,
  enrollments,
  registered_devices,
  timetables,
  attendance_rules,
  notifications
};

const seedJsContent = `// PostgreSQL Seed Script for AntiProxy Backend
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, isPg, getMemoryDb, initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  if (!isPg()) {
    await initDb();
  }

  const seedSqlPath = path.join(__dirname, 'seed.sql');
  const sql = fs.readFileSync(seedSqlPath, 'utf-8');

  const seedData = ${JSON.stringify(seedDataObject, null, 2)};

  const memory = getMemoryDb();

  if (isPg()) {
    try {
      // Execute the master SQL script directly on PostgreSQL
      await query(sql);
      console.log('✅ REAL PostgreSQL development database seeded successfully from seed.sql.');
    } catch (err) {
      console.error('Seed Postgres error:', err.message);
    }
  }

  // Populate memory fallback
  Object.keys(seedData).forEach((key) => {
    memory[key] = [...seedData[key]];
  });

  console.log('✅ Memory database populated with seed records.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await seedDatabase();
  process.exit(0);
}
`;

fs.writeFileSync(path.join(__dirname, 'seed.js'), seedJsContent);
console.log('✅ Updated seed.js to load seed.sql');

