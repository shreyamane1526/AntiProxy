import bcrypt from 'bcryptjs';
import { query, isPg, getMemoryDb } from './db.js';

export async function seedDatabase() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('demo', salt);

  const seedData = {
    users: [
      { id: 'u-student-1', email: 'aanya.sharma@college.edu', password_hash: hashedPassword, role: 'student', name: 'Aanya Sharma' },
      { id: 'u-teacher-1', email: 'r.mehta@college.edu', password_hash: hashedPassword, role: 'teacher', name: 'Prof. R. Mehta' },
      { id: 'u-hod-1', email: 'hod.cse@college.edu', password_hash: hashedPassword, role: 'hod', name: 'Dr. Kavita Iyer' },
      { id: 'u-admin-1', email: 'admin@college.edu', password_hash: hashedPassword, role: 'admin', name: 'System Administrator' },
    ],
    departments: [
      { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE' },
      { id: 'dept-ece', name: 'Electronics & Communication', code: 'ECE' },
    ],
    students: [
      {
        id: 'stu-21csb042',
        user_id: 'u-student-1',
        roll_no: '21CSB042',
        division: 'CSE-B',
        year: 'Third Year',
        programme: 'B.Tech Computer Science',
        photo_url: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
    ],
    teachers: [
      {
        id: 'tch-mehta',
        user_id: 'u-teacher-1',
        department: 'Computer Science',
        designation: 'Associate Professor',
        employee_id: 'CSE-1044',
        photo_url: 'https://randomuser.me/api/portraits/men/32.jpg',
      },
    ],
    hods: [
      {
        id: 'hod-iyer',
        user_id: 'u-hod-1',
        department: 'Computer Science',
        designation: 'Head of Department',
        photo_url: 'https://randomuser.me/api/portraits/women/68.jpg',
      },
    ],
    admins: [
      {
        id: 'adm-01',
        user_id: 'u-admin-1',
        department: 'IT & System Admin',
      },
    ],
    classes: [
      { id: 'class-dbms-b', name: 'DBMS', code: 'CS301', division: 'CSE-B', type: 'Lecture' },
      { id: 'class-dbms-a', name: 'DBMS', code: 'CS301', division: 'CSE-A', type: 'Lecture' },
      { id: 'class-dbms-lab-b', name: 'DBMS Lab', code: 'CS301L', division: 'CSE-B', type: 'Lab' },
      { id: 'class-cn-b', name: 'Computer Networks', code: 'CS302', division: 'CSE-B', type: 'Lecture' },
      { id: 'class-daa-b', name: 'DAA', code: 'CS303', division: 'CSE-B', type: 'Lecture' },
      { id: 'class-os-b', name: 'Operating Systems', code: 'CS304', division: 'CSE-B', type: 'Lecture' },
      { id: 'class-ai-b', name: 'AI', code: 'CS305', division: 'CSE-B', type: 'Lecture' },
    ],
    subjects: [
      { id: 'sub-dbms', code: 'CS301', name: 'DBMS', teacher_id: 'tch-mehta', division: 'CSE-B' },
      { id: 'sub-cn', code: 'CS302', name: 'Computer Networks', teacher_id: 'tch-mehta', division: 'CSE-B' },
      { id: 'sub-daa', code: 'CS303', name: 'DAA', teacher_id: 'tch-mehta', division: 'CSE-B' },
      { id: 'sub-os', code: 'CS304', name: 'Operating Systems', teacher_id: 'tch-mehta', division: 'CSE-B' },
      { id: 'sub-ai', code: 'CS305', name: 'AI', teacher_id: 'tch-mehta', division: 'CSE-B' },
    ],
    enrollments: [
      { id: 'enr-1', student_id: 'stu-21csb042', class_id: 'class-dbms-b' },
      { id: 'enr-2', student_id: 'stu-21csb042', class_id: 'class-cn-b' },
      { id: 'enr-3', student_id: 'stu-21csb042', class_id: 'class-daa-b' },
      { id: 'enr-4', student_id: 'stu-21csb042', class_id: 'class-os-b' },
      { id: 'enr-5', student_id: 'stu-21csb042', class_id: 'class-ai-b' },
    ],
    registered_devices: [
      {
        id: 'dev-001',
        student_id: 'stu-21csb042',
        device_name: "Aanya's Pixel · BLE-4421",
        device_identifier: 'BLE-4421-DEV-001',
        status: 'active',
        registered_at: new Date().toISOString(),
      },
    ],
    attendance_rules: [
      { id: 'rule-1', name: 'Low Attendance Warning', threshold_percent: 80.0, consecutive_absences: 2, action: 'STUDENT_WARNING', target_role: 'student', enabled: true },
      { id: 'rule-2', name: 'Defaulter Alert', threshold_percent: 75.0, consecutive_absences: 3, action: 'FACULTY_ALERT', target_role: 'teacher', enabled: true },
      { id: 'rule-3', name: 'Critical Escalation', threshold_percent: 70.0, consecutive_absences: 4, action: 'HOD_ESCALATION', target_role: 'hod', enabled: true },
    ],
    notifications: [
      { id: 'n1', user_id: 'u-student-1', role: 'student', title: 'Attendance marked', body: 'You were marked Present for DBMS · 10:00 AM.', time_str: 'Today, 10:06 AM', unread: true },
      { id: 'n2', user_id: 'u-student-1', role: 'student', title: 'Attendance warning', body: 'DAA is at 72.7%. Two more absences will keep you below 75%.', time_str: 'Yesterday', unread: true },
      { id: 'n3', user_id: 'u-teacher-1', role: 'teacher', title: 'Session QR generated', body: 'Dynamic QR is active for DBMS · CSE-B · Lab 3.', time_str: 'Today, 10:01 AM', unread: true },
      { id: 'n4', user_id: 'u-hod-1', role: 'hod', title: 'Department summary', body: 'CSE attendance this week averaged 82%.', time_str: 'Today', unread: true },
    ]
  };

  const memory = getMemoryDb();

  if (isPg()) {
    try {
      for (const u of seedData.users) {
        await query(
          `INSERT INTO users (id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING;`,
          [u.id, u.email, u.password_hash, u.role, u.name]
        );
      }
      for (const d of seedData.departments) {
        await query(
          `INSERT INTO departments (id, name, code) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING;`,
          [d.id, d.name, d.code]
        );
      }
      for (const s of seedData.students) {
        await query(
          `INSERT INTO students (id, user_id, roll_no, division, year, programme, photo_url) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING;`,
          [s.id, s.user_id, s.roll_no, s.division, s.year, s.programme, s.photo_url]
        );
      }
      for (const t of seedData.teachers) {
        await query(
          `INSERT INTO teachers (id, user_id, department, designation, employee_id, photo_url) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING;`,
          [t.id, t.user_id, t.department, t.designation, t.employee_id, t.photo_url]
        );
      }
      for (const h of seedData.hods) {
        await query(
          `INSERT INTO hods (id, user_id, department, designation, photo_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING;`,
          [h.id, h.user_id, h.department, h.designation, h.photo_url]
        );
      }
      for (const a of seedData.admins) {
        await query(
          `INSERT INTO admins (id, user_id, department) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING;`,
          [a.id, a.user_id, a.department]
        );
      }
      for (const c of seedData.classes) {
        await query(
          `INSERT INTO classes (id, name, code, division, type) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING;`,
          [c.id, c.name, c.code, c.division, c.type]
        );
      }
      for (const sub of seedData.subjects) {
        await query(
          `INSERT INTO subjects (id, code, name, teacher_id, division) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING;`,
          [sub.id, sub.code, sub.name, sub.teacher_id, sub.division]
        );
      }
      for (const dev of seedData.registered_devices) {
        await query(
          `INSERT INTO registered_devices (id, student_id, device_name, device_identifier, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING;`,
          [dev.id, dev.student_id, dev.device_name, dev.device_identifier, dev.status]
        );
      }
      for (const r of seedData.attendance_rules) {
        await query(
          `INSERT INTO attendance_rules (id, name, threshold_percent, consecutive_absences, action, target_role, enabled) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING;`,
          [r.id, r.name, r.threshold_percent, r.consecutive_absences, r.action, r.target_role, r.enabled]
        );
      }
      for (const n of seedData.notifications) {
        await query(
          `INSERT INTO notifications (id, user_id, role, title, body, time_str, unread) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING;`,
          [n.id, n.user_id, n.role, n.title, n.body, n.time_str, n.unread]
        );
      }
      console.log('✅ Seed data inserted into PostgreSQL.');
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
