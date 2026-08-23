// PostgreSQL Seed Script for AntiProxy Backend
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

  const seedData = {
  "users": [
    {
      "id": "usr-t001",
      "email": "priya.sharma@antiproxy.dev",
      "password_hash": "$2a$10$SIz/66pcyWGyC6wg6ZHaXOqJRfxA7zCwHwmdvFztUH80p7PD3l7Z6",
      "role": "teacher",
      "name": "Priya Sharma"
    },
    {
      "id": "usr-t002",
      "email": "rahul.mehta@antiproxy.dev",
      "password_hash": "$2a$10$SIz/66pcyWGyC6wg6ZHaXOqJRfxA7zCwHwmdvFztUH80p7PD3l7Z6",
      "role": "teacher",
      "name": "Rahul Mehta"
    },
    {
      "id": "usr-t003",
      "email": "ananya.rao@antiproxy.dev",
      "password_hash": "$2a$10$SIz/66pcyWGyC6wg6ZHaXOqJRfxA7zCwHwmdvFztUH80p7PD3l7Z6",
      "role": "teacher",
      "name": "Ananya Rao"
    },
    {
      "id": "usr-t004",
      "email": "arjun.patel@antiproxy.dev",
      "password_hash": "$2a$10$SIz/66pcyWGyC6wg6ZHaXOqJRfxA7zCwHwmdvFztUH80p7PD3l7Z6",
      "role": "teacher",
      "name": "Arjun Patel"
    },
    {
      "id": "usr-hod001",
      "email": "neha.kapoor@antiproxy.dev",
      "password_hash": "$2a$10$Ggt3tC4CKnBydlSVc2iHq.q5ws4XSVlCzf.zGjoAQv2kI/WhL8nVW",
      "role": "hod",
      "name": "Dr. Neha Kapoor"
    },
    {
      "id": "usr-admin001",
      "email": "admin@antiproxy.dev",
      "password_hash": "$2a$10$SIz/66pcyWGyC6wg6ZHaXOqJRfxA7zCwHwmdvFztUH80p7PD3l7Z6",
      "role": "admin",
      "name": "System Administrator"
    },
    {
      "id": "usr-stu-a01",
      "email": "student.a01@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A01"
    },
    {
      "id": "usr-stu-a02",
      "email": "student.a02@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A02"
    },
    {
      "id": "usr-stu-a03",
      "email": "student.a03@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A03"
    },
    {
      "id": "usr-stu-a04",
      "email": "student.a04@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A04"
    },
    {
      "id": "usr-stu-a05",
      "email": "student.a05@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A05"
    },
    {
      "id": "usr-stu-a06",
      "email": "student.a06@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A06"
    },
    {
      "id": "usr-stu-a07",
      "email": "student.a07@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A07"
    },
    {
      "id": "usr-stu-a08",
      "email": "student.a08@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A08"
    },
    {
      "id": "usr-stu-a09",
      "email": "student.a09@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A09"
    },
    {
      "id": "usr-stu-a10",
      "email": "student.a10@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A10"
    },
    {
      "id": "usr-stu-a11",
      "email": "student.a11@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A11"
    },
    {
      "id": "usr-stu-a12",
      "email": "student.a12@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A12"
    },
    {
      "id": "usr-stu-a13",
      "email": "student.a13@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A13"
    },
    {
      "id": "usr-stu-a14",
      "email": "student.a14@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A14"
    },
    {
      "id": "usr-stu-a15",
      "email": "student.a15@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student A15"
    },
    {
      "id": "usr-stu-b01",
      "email": "student.b01@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B01"
    },
    {
      "id": "usr-stu-b02",
      "email": "student.b02@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B02"
    },
    {
      "id": "usr-stu-b03",
      "email": "student.b03@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B03"
    },
    {
      "id": "usr-stu-b04",
      "email": "student.b04@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B04"
    },
    {
      "id": "usr-stu-b05",
      "email": "student.b05@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B05"
    },
    {
      "id": "usr-stu-b06",
      "email": "student.b06@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B06"
    },
    {
      "id": "usr-stu-b07",
      "email": "student.b07@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B07"
    },
    {
      "id": "usr-stu-b08",
      "email": "student.b08@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B08"
    },
    {
      "id": "usr-stu-b09",
      "email": "student.b09@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B09"
    },
    {
      "id": "usr-stu-b10",
      "email": "student.b10@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B10"
    },
    {
      "id": "usr-stu-b11",
      "email": "student.b11@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B11"
    },
    {
      "id": "usr-stu-b12",
      "email": "student.b12@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B12"
    },
    {
      "id": "usr-stu-b13",
      "email": "student.b13@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B13"
    },
    {
      "id": "usr-stu-b14",
      "email": "student.b14@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B14"
    },
    {
      "id": "usr-stu-b15",
      "email": "student.b15@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student B15"
    },
    {
      "id": "usr-stu-c01",
      "email": "student.c01@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C01"
    },
    {
      "id": "usr-stu-c02",
      "email": "student.c02@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C02"
    },
    {
      "id": "usr-stu-c03",
      "email": "student.c03@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C03"
    },
    {
      "id": "usr-stu-c04",
      "email": "student.c04@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C04"
    },
    {
      "id": "usr-stu-c05",
      "email": "student.c05@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C05"
    },
    {
      "id": "usr-stu-c06",
      "email": "student.c06@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C06"
    },
    {
      "id": "usr-stu-c07",
      "email": "student.c07@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C07"
    },
    {
      "id": "usr-stu-c08",
      "email": "student.c08@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C08"
    },
    {
      "id": "usr-stu-c09",
      "email": "student.c09@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C09"
    },
    {
      "id": "usr-stu-c10",
      "email": "student.c10@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C10"
    },
    {
      "id": "usr-stu-c11",
      "email": "student.c11@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C11"
    },
    {
      "id": "usr-stu-c12",
      "email": "student.c12@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C12"
    },
    {
      "id": "usr-stu-c13",
      "email": "student.c13@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C13"
    },
    {
      "id": "usr-stu-c14",
      "email": "student.c14@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C14"
    },
    {
      "id": "usr-stu-c15",
      "email": "student.c15@antiproxy.dev",
      "password_hash": "$2a$10$UtD85P.YarlbJXV7D5r3JuVIeSA.iRBSfA0yakO2sx8.iL0uvBaEy",
      "role": "student",
      "name": "Student C15"
    }
  ],
  "departments": [
    {
      "id": "dept-cse",
      "name": "Computer Science & Engineering",
      "code": "CSE"
    }
  ],
  "classes": [
    {
      "id": "cls-cse-a",
      "department_id": "dept-cse",
      "name": "B.Tech Computer Science & Engineering - Div A",
      "code": "CSE-A",
      "division": "CSE-A",
      "type": "Lecture"
    },
    {
      "id": "cls-cse-b",
      "department_id": "dept-cse",
      "name": "B.Tech Computer Science & Engineering - Div B",
      "code": "CSE-B",
      "division": "CSE-B",
      "type": "Lecture"
    },
    {
      "id": "cls-cse-c",
      "department_id": "dept-cse",
      "name": "B.Tech Computer Science & Engineering - Div C",
      "code": "CSE-C",
      "division": "CSE-C",
      "type": "Lecture"
    }
  ],
  "subjects": [
    {
      "id": "sub-cs301",
      "code": "CS301",
      "name": "Database Management Systems",
      "teacher_id": "tch-t001",
      "division": "CSE-A"
    },
    {
      "id": "sub-cs302",
      "code": "CS302",
      "name": "Operating Systems",
      "teacher_id": "tch-t002",
      "division": "CSE-A"
    },
    {
      "id": "sub-cs303",
      "code": "CS303",
      "name": "Computer Networks",
      "teacher_id": "tch-t003",
      "division": "CSE-B"
    },
    {
      "id": "sub-cs304",
      "code": "CS304",
      "name": "Software Engineering",
      "teacher_id": "tch-t004",
      "division": "CSE-A"
    },
    {
      "id": "sub-cs305",
      "code": "CS305",
      "name": "Data Structures",
      "teacher_id": "tch-t001",
      "division": "CSE-A"
    }
  ],
  "teachers": [
    {
      "id": "tch-t001",
      "user_id": "usr-t001",
      "department_id": "dept-cse",
      "designation": "Assistant Professor",
      "employee_id": "T001",
      "photo_url": "https://randomuser.me/api/portraits/women/31.jpg"
    },
    {
      "id": "tch-t002",
      "user_id": "usr-t002",
      "department_id": "dept-cse",
      "designation": "Assistant Professor",
      "employee_id": "T002",
      "photo_url": "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      "id": "tch-t003",
      "user_id": "usr-t003",
      "department_id": "dept-cse",
      "designation": "Assistant Professor",
      "employee_id": "T003",
      "photo_url": "https://randomuser.me/api/portraits/women/33.jpg"
    },
    {
      "id": "tch-t004",
      "user_id": "usr-t004",
      "department_id": "dept-cse",
      "designation": "Assistant Professor",
      "employee_id": "T004",
      "photo_url": "https://randomuser.me/api/portraits/men/34.jpg"
    }
  ],
  "hods": [
    {
      "id": "hod-001",
      "user_id": "usr-hod001",
      "department_id": "dept-cse",
      "designation": "Head of Department",
      "photo_url": "https://randomuser.me/api/portraits/women/68.jpg"
    }
  ],
  "admins": [
    {
      "id": "adm-001",
      "user_id": "usr-admin001",
      "department_id": "dept-cse"
    }
  ],
  "teacher_subject_assignments": [
    {
      "id": "tsa-ps-dbms-csea",
      "teacher_id": "tch-t001",
      "subject_id": "sub-cs301",
      "class_id": "cls-cse-a"
    },
    {
      "id": "tsa-ps-dbms-cseb",
      "teacher_id": "tch-t001",
      "subject_id": "sub-cs301",
      "class_id": "cls-cse-b"
    },
    {
      "id": "tsa-ps-ds-csea",
      "teacher_id": "tch-t001",
      "subject_id": "sub-cs305",
      "class_id": "cls-cse-a"
    },
    {
      "id": "tsa-rm-os-csea",
      "teacher_id": "tch-t002",
      "subject_id": "sub-cs302",
      "class_id": "cls-cse-a"
    },
    {
      "id": "tsa-rm-os-csec",
      "teacher_id": "tch-t002",
      "subject_id": "sub-cs302",
      "class_id": "cls-cse-c"
    },
    {
      "id": "tsa-ar-cn-cseb",
      "teacher_id": "tch-t003",
      "subject_id": "sub-cs303",
      "class_id": "cls-cse-b"
    },
    {
      "id": "tsa-ar-cn-csec",
      "teacher_id": "tch-t003",
      "subject_id": "sub-cs303",
      "class_id": "cls-cse-c"
    },
    {
      "id": "tsa-ap-se-csea",
      "teacher_id": "tch-t004",
      "subject_id": "sub-cs304",
      "class_id": "cls-cse-a"
    },
    {
      "id": "tsa-ap-se-csec",
      "teacher_id": "tch-t004",
      "subject_id": "sub-cs304",
      "class_id": "cls-cse-c"
    }
  ],
  "students": [
    {
      "id": "stu-csea-01",
      "user_id": "usr-stu-a01",
      "roll_no": "CSEA01",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/13.jpg"
    },
    {
      "id": "stu-csea-02",
      "user_id": "usr-stu-a02",
      "roll_no": "CSEA02",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/16.jpg"
    },
    {
      "id": "stu-csea-03",
      "user_id": "usr-stu-a03",
      "roll_no": "CSEA03",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/19.jpg"
    },
    {
      "id": "stu-csea-04",
      "user_id": "usr-stu-a04",
      "roll_no": "CSEA04",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/22.jpg"
    },
    {
      "id": "stu-csea-05",
      "user_id": "usr-stu-a05",
      "roll_no": "CSEA05",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/25.jpg"
    },
    {
      "id": "stu-csea-06",
      "user_id": "usr-stu-a06",
      "roll_no": "CSEA06",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/28.jpg"
    },
    {
      "id": "stu-csea-07",
      "user_id": "usr-stu-a07",
      "roll_no": "CSEA07",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/31.jpg"
    },
    {
      "id": "stu-csea-08",
      "user_id": "usr-stu-a08",
      "roll_no": "CSEA08",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/34.jpg"
    },
    {
      "id": "stu-csea-09",
      "user_id": "usr-stu-a09",
      "roll_no": "CSEA09",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/37.jpg"
    },
    {
      "id": "stu-csea-10",
      "user_id": "usr-stu-a10",
      "roll_no": "CSEA10",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/40.jpg"
    },
    {
      "id": "stu-csea-11",
      "user_id": "usr-stu-a11",
      "roll_no": "CSEA11",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/43.jpg"
    },
    {
      "id": "stu-csea-12",
      "user_id": "usr-stu-a12",
      "roll_no": "CSEA12",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/46.jpg"
    },
    {
      "id": "stu-csea-13",
      "user_id": "usr-stu-a13",
      "roll_no": "CSEA13",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/49.jpg"
    },
    {
      "id": "stu-csea-14",
      "user_id": "usr-stu-a14",
      "roll_no": "CSEA14",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/52.jpg"
    },
    {
      "id": "stu-csea-15",
      "user_id": "usr-stu-a15",
      "roll_no": "CSEA15",
      "division": "CSE-A",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/55.jpg"
    },
    {
      "id": "stu-cseb-01",
      "user_id": "usr-stu-b01",
      "roll_no": "CSEB01",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/13.jpg"
    },
    {
      "id": "stu-cseb-02",
      "user_id": "usr-stu-b02",
      "roll_no": "CSEB02",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/16.jpg"
    },
    {
      "id": "stu-cseb-03",
      "user_id": "usr-stu-b03",
      "roll_no": "CSEB03",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/19.jpg"
    },
    {
      "id": "stu-cseb-04",
      "user_id": "usr-stu-b04",
      "roll_no": "CSEB04",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/22.jpg"
    },
    {
      "id": "stu-cseb-05",
      "user_id": "usr-stu-b05",
      "roll_no": "CSEB05",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/25.jpg"
    },
    {
      "id": "stu-cseb-06",
      "user_id": "usr-stu-b06",
      "roll_no": "CSEB06",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/28.jpg"
    },
    {
      "id": "stu-cseb-07",
      "user_id": "usr-stu-b07",
      "roll_no": "CSEB07",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/31.jpg"
    },
    {
      "id": "stu-cseb-08",
      "user_id": "usr-stu-b08",
      "roll_no": "CSEB08",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/34.jpg"
    },
    {
      "id": "stu-cseb-09",
      "user_id": "usr-stu-b09",
      "roll_no": "CSEB09",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/37.jpg"
    },
    {
      "id": "stu-cseb-10",
      "user_id": "usr-stu-b10",
      "roll_no": "CSEB10",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/40.jpg"
    },
    {
      "id": "stu-cseb-11",
      "user_id": "usr-stu-b11",
      "roll_no": "CSEB11",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/43.jpg"
    },
    {
      "id": "stu-cseb-12",
      "user_id": "usr-stu-b12",
      "roll_no": "CSEB12",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/46.jpg"
    },
    {
      "id": "stu-cseb-13",
      "user_id": "usr-stu-b13",
      "roll_no": "CSEB13",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/49.jpg"
    },
    {
      "id": "stu-cseb-14",
      "user_id": "usr-stu-b14",
      "roll_no": "CSEB14",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/52.jpg"
    },
    {
      "id": "stu-cseb-15",
      "user_id": "usr-stu-b15",
      "roll_no": "CSEB15",
      "division": "CSE-B",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/55.jpg"
    },
    {
      "id": "stu-csec-01",
      "user_id": "usr-stu-c01",
      "roll_no": "CSEC01",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/13.jpg"
    },
    {
      "id": "stu-csec-02",
      "user_id": "usr-stu-c02",
      "roll_no": "CSEC02",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/16.jpg"
    },
    {
      "id": "stu-csec-03",
      "user_id": "usr-stu-c03",
      "roll_no": "CSEC03",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/19.jpg"
    },
    {
      "id": "stu-csec-04",
      "user_id": "usr-stu-c04",
      "roll_no": "CSEC04",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/22.jpg"
    },
    {
      "id": "stu-csec-05",
      "user_id": "usr-stu-c05",
      "roll_no": "CSEC05",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/25.jpg"
    },
    {
      "id": "stu-csec-06",
      "user_id": "usr-stu-c06",
      "roll_no": "CSEC06",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/28.jpg"
    },
    {
      "id": "stu-csec-07",
      "user_id": "usr-stu-c07",
      "roll_no": "CSEC07",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/31.jpg"
    },
    {
      "id": "stu-csec-08",
      "user_id": "usr-stu-c08",
      "roll_no": "CSEC08",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/34.jpg"
    },
    {
      "id": "stu-csec-09",
      "user_id": "usr-stu-c09",
      "roll_no": "CSEC09",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/37.jpg"
    },
    {
      "id": "stu-csec-10",
      "user_id": "usr-stu-c10",
      "roll_no": "CSEC10",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/40.jpg"
    },
    {
      "id": "stu-csec-11",
      "user_id": "usr-stu-c11",
      "roll_no": "CSEC11",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/43.jpg"
    },
    {
      "id": "stu-csec-12",
      "user_id": "usr-stu-c12",
      "roll_no": "CSEC12",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/46.jpg"
    },
    {
      "id": "stu-csec-13",
      "user_id": "usr-stu-c13",
      "roll_no": "CSEC13",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/49.jpg"
    },
    {
      "id": "stu-csec-14",
      "user_id": "usr-stu-c14",
      "roll_no": "CSEC14",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/women/52.jpg"
    },
    {
      "id": "stu-csec-15",
      "user_id": "usr-stu-c15",
      "roll_no": "CSEC15",
      "division": "CSE-C",
      "year": "3",
      "programme": "B.Tech Computer Science & Engineering",
      "photo_url": "https://randomuser.me/api/portraits/men/55.jpg"
    }
  ],
  "enrollments": [
    {
      "id": "enr-a-01",
      "student_id": "stu-csea-01",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-02",
      "student_id": "stu-csea-02",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-03",
      "student_id": "stu-csea-03",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-04",
      "student_id": "stu-csea-04",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-05",
      "student_id": "stu-csea-05",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-06",
      "student_id": "stu-csea-06",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-07",
      "student_id": "stu-csea-07",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-08",
      "student_id": "stu-csea-08",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-09",
      "student_id": "stu-csea-09",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-10",
      "student_id": "stu-csea-10",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-11",
      "student_id": "stu-csea-11",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-12",
      "student_id": "stu-csea-12",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-13",
      "student_id": "stu-csea-13",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-14",
      "student_id": "stu-csea-14",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-a-15",
      "student_id": "stu-csea-15",
      "class_id": "cls-cse-a"
    },
    {
      "id": "enr-b-01",
      "student_id": "stu-cseb-01",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-02",
      "student_id": "stu-cseb-02",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-03",
      "student_id": "stu-cseb-03",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-04",
      "student_id": "stu-cseb-04",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-05",
      "student_id": "stu-cseb-05",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-06",
      "student_id": "stu-cseb-06",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-07",
      "student_id": "stu-cseb-07",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-08",
      "student_id": "stu-cseb-08",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-09",
      "student_id": "stu-cseb-09",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-10",
      "student_id": "stu-cseb-10",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-11",
      "student_id": "stu-cseb-11",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-12",
      "student_id": "stu-cseb-12",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-13",
      "student_id": "stu-cseb-13",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-14",
      "student_id": "stu-cseb-14",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-b-15",
      "student_id": "stu-cseb-15",
      "class_id": "cls-cse-b"
    },
    {
      "id": "enr-c-01",
      "student_id": "stu-csec-01",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-02",
      "student_id": "stu-csec-02",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-03",
      "student_id": "stu-csec-03",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-04",
      "student_id": "stu-csec-04",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-05",
      "student_id": "stu-csec-05",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-06",
      "student_id": "stu-csec-06",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-07",
      "student_id": "stu-csec-07",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-08",
      "student_id": "stu-csec-08",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-09",
      "student_id": "stu-csec-09",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-10",
      "student_id": "stu-csec-10",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-11",
      "student_id": "stu-csec-11",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-12",
      "student_id": "stu-csec-12",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-13",
      "student_id": "stu-csec-13",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-14",
      "student_id": "stu-csec-14",
      "class_id": "cls-cse-c"
    },
    {
      "id": "enr-c-15",
      "student_id": "stu-csec-15",
      "class_id": "cls-cse-c"
    }
  ],
  "registered_devices": [
    {
      "id": "dev-a-01",
      "student_id": "stu-csea-01",
      "device_name": "Student A01 Device",
      "device_identifier": "BLE-CSEA01-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-02",
      "student_id": "stu-csea-02",
      "device_name": "Student A02 Device",
      "device_identifier": "BLE-CSEA02-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-03",
      "student_id": "stu-csea-03",
      "device_name": "Student A03 Device",
      "device_identifier": "BLE-CSEA03-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-04",
      "student_id": "stu-csea-04",
      "device_name": "Student A04 Device",
      "device_identifier": "BLE-CSEA04-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-05",
      "student_id": "stu-csea-05",
      "device_name": "Student A05 Device",
      "device_identifier": "BLE-CSEA05-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-06",
      "student_id": "stu-csea-06",
      "device_name": "Student A06 Device",
      "device_identifier": "BLE-CSEA06-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-07",
      "student_id": "stu-csea-07",
      "device_name": "Student A07 Device",
      "device_identifier": "BLE-CSEA07-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-08",
      "student_id": "stu-csea-08",
      "device_name": "Student A08 Device",
      "device_identifier": "BLE-CSEA08-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-09",
      "student_id": "stu-csea-09",
      "device_name": "Student A09 Device",
      "device_identifier": "BLE-CSEA09-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-10",
      "student_id": "stu-csea-10",
      "device_name": "Student A10 Device",
      "device_identifier": "BLE-CSEA10-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-11",
      "student_id": "stu-csea-11",
      "device_name": "Student A11 Device",
      "device_identifier": "BLE-CSEA11-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-12",
      "student_id": "stu-csea-12",
      "device_name": "Student A12 Device",
      "device_identifier": "BLE-CSEA12-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-13",
      "student_id": "stu-csea-13",
      "device_name": "Student A13 Device",
      "device_identifier": "BLE-CSEA13-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-14",
      "student_id": "stu-csea-14",
      "device_name": "Student A14 Device",
      "device_identifier": "BLE-CSEA14-DEV",
      "status": "active"
    },
    {
      "id": "dev-a-15",
      "student_id": "stu-csea-15",
      "device_name": "Student A15 Device",
      "device_identifier": "BLE-CSEA15-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-01",
      "student_id": "stu-cseb-01",
      "device_name": "Student B01 Device",
      "device_identifier": "BLE-CSEB01-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-02",
      "student_id": "stu-cseb-02",
      "device_name": "Student B02 Device",
      "device_identifier": "BLE-CSEB02-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-03",
      "student_id": "stu-cseb-03",
      "device_name": "Student B03 Device",
      "device_identifier": "BLE-CSEB03-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-04",
      "student_id": "stu-cseb-04",
      "device_name": "Student B04 Device",
      "device_identifier": "BLE-CSEB04-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-05",
      "student_id": "stu-cseb-05",
      "device_name": "Student B05 Device",
      "device_identifier": "BLE-CSEB05-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-06",
      "student_id": "stu-cseb-06",
      "device_name": "Student B06 Device",
      "device_identifier": "BLE-CSEB06-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-07",
      "student_id": "stu-cseb-07",
      "device_name": "Student B07 Device",
      "device_identifier": "BLE-CSEB07-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-08",
      "student_id": "stu-cseb-08",
      "device_name": "Student B08 Device",
      "device_identifier": "BLE-CSEB08-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-09",
      "student_id": "stu-cseb-09",
      "device_name": "Student B09 Device",
      "device_identifier": "BLE-CSEB09-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-10",
      "student_id": "stu-cseb-10",
      "device_name": "Student B10 Device",
      "device_identifier": "BLE-CSEB10-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-11",
      "student_id": "stu-cseb-11",
      "device_name": "Student B11 Device",
      "device_identifier": "BLE-CSEB11-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-12",
      "student_id": "stu-cseb-12",
      "device_name": "Student B12 Device",
      "device_identifier": "BLE-CSEB12-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-13",
      "student_id": "stu-cseb-13",
      "device_name": "Student B13 Device",
      "device_identifier": "BLE-CSEB13-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-14",
      "student_id": "stu-cseb-14",
      "device_name": "Student B14 Device",
      "device_identifier": "BLE-CSEB14-DEV",
      "status": "active"
    },
    {
      "id": "dev-b-15",
      "student_id": "stu-cseb-15",
      "device_name": "Student B15 Device",
      "device_identifier": "BLE-CSEB15-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-01",
      "student_id": "stu-csec-01",
      "device_name": "Student C01 Device",
      "device_identifier": "BLE-CSEC01-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-02",
      "student_id": "stu-csec-02",
      "device_name": "Student C02 Device",
      "device_identifier": "BLE-CSEC02-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-03",
      "student_id": "stu-csec-03",
      "device_name": "Student C03 Device",
      "device_identifier": "BLE-CSEC03-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-04",
      "student_id": "stu-csec-04",
      "device_name": "Student C04 Device",
      "device_identifier": "BLE-CSEC04-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-05",
      "student_id": "stu-csec-05",
      "device_name": "Student C05 Device",
      "device_identifier": "BLE-CSEC05-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-06",
      "student_id": "stu-csec-06",
      "device_name": "Student C06 Device",
      "device_identifier": "BLE-CSEC06-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-07",
      "student_id": "stu-csec-07",
      "device_name": "Student C07 Device",
      "device_identifier": "BLE-CSEC07-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-08",
      "student_id": "stu-csec-08",
      "device_name": "Student C08 Device",
      "device_identifier": "BLE-CSEC08-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-09",
      "student_id": "stu-csec-09",
      "device_name": "Student C09 Device",
      "device_identifier": "BLE-CSEC09-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-10",
      "student_id": "stu-csec-10",
      "device_name": "Student C10 Device",
      "device_identifier": "BLE-CSEC10-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-11",
      "student_id": "stu-csec-11",
      "device_name": "Student C11 Device",
      "device_identifier": "BLE-CSEC11-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-12",
      "student_id": "stu-csec-12",
      "device_name": "Student C12 Device",
      "device_identifier": "BLE-CSEC12-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-13",
      "student_id": "stu-csec-13",
      "device_name": "Student C13 Device",
      "device_identifier": "BLE-CSEC13-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-14",
      "student_id": "stu-csec-14",
      "device_name": "Student C14 Device",
      "device_identifier": "BLE-CSEC14-DEV",
      "status": "active"
    },
    {
      "id": "dev-c-15",
      "student_id": "stu-csec-15",
      "device_name": "Student C15 Device",
      "device_identifier": "BLE-CSEC15-DEV",
      "status": "active"
    }
  ],
  "timetables": [
    {
      "id": "tt-csea-mon-1",
      "class_id": "cls-cse-a",
      "teacher_id": "tch-t001",
      "subject_id": "sub-cs301",
      "day_of_week": "Monday",
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "room": "Room 201"
    },
    {
      "id": "tt-csea-mon-2",
      "class_id": "cls-cse-a",
      "teacher_id": "tch-t002",
      "subject_id": "sub-cs302",
      "day_of_week": "Monday",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "room": "Room 201"
    },
    {
      "id": "tt-csea-mon-3",
      "class_id": "cls-cse-a",
      "teacher_id": "tch-t004",
      "subject_id": "sub-cs304",
      "day_of_week": "Monday",
      "start_time": "11:15:00",
      "end_time": "12:15:00",
      "room": "Room 201"
    },
    {
      "id": "tt-csea-tue-2",
      "class_id": "cls-cse-a",
      "teacher_id": "tch-t001",
      "subject_id": "sub-cs301",
      "day_of_week": "Tuesday",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "room": "Room 201"
    },
    {
      "id": "tt-csea-wed-1",
      "class_id": "cls-cse-a",
      "teacher_id": "tch-t002",
      "subject_id": "sub-cs302",
      "day_of_week": "Wednesday",
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "room": "Room 201"
    },
    {
      "id": "tt-csea-wed-2",
      "class_id": "cls-cse-a",
      "teacher_id": "tch-t001",
      "subject_id": "sub-cs305",
      "day_of_week": "Wednesday",
      "start_time": "11:00:00",
      "end_time": "12:00:00",
      "room": "Room 201"
    },
    {
      "id": "tt-csea-thu-1",
      "class_id": "cls-cse-a",
      "teacher_id": "tch-t001",
      "subject_id": "sub-cs301",
      "day_of_week": "Thursday",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "room": "Room 201"
    },
    {
      "id": "tt-csea-thu-2",
      "class_id": "cls-cse-a",
      "teacher_id": "tch-t004",
      "subject_id": "sub-cs304",
      "day_of_week": "Thursday",
      "start_time": "11:00:00",
      "end_time": "12:00:00",
      "room": "Room 201"
    },
    {
      "id": "tt-csea-fri-1",
      "class_id": "cls-cse-a",
      "teacher_id": "tch-t002",
      "subject_id": "sub-cs302",
      "day_of_week": "Friday",
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "room": "Room 201"
    },
    {
      "id": "tt-cseb-mon-1",
      "class_id": "cls-cse-b",
      "teacher_id": "tch-t003",
      "subject_id": "sub-cs303",
      "day_of_week": "Monday",
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "room": "Room 202"
    },
    {
      "id": "tt-cseb-mon-2",
      "class_id": "cls-cse-b",
      "teacher_id": "tch-t001",
      "subject_id": "sub-cs301",
      "day_of_week": "Monday",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "room": "Room 202"
    },
    {
      "id": "tt-cseb-tue-1",
      "class_id": "cls-cse-b",
      "teacher_id": "tch-t003",
      "subject_id": "sub-cs303",
      "day_of_week": "Tuesday",
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "room": "Room 202"
    },
    {
      "id": "tt-cseb-wed-1",
      "class_id": "cls-cse-b",
      "teacher_id": "tch-t001",
      "subject_id": "sub-cs301",
      "day_of_week": "Wednesday",
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "room": "Room 202"
    },
    {
      "id": "tt-cseb-wed-2",
      "class_id": "cls-cse-b",
      "teacher_id": "tch-t003",
      "subject_id": "sub-cs303",
      "day_of_week": "Wednesday",
      "start_time": "11:00:00",
      "end_time": "12:00:00",
      "room": "Room 202"
    },
    {
      "id": "tt-cseb-thu-1",
      "class_id": "cls-cse-b",
      "teacher_id": "tch-t001",
      "subject_id": "sub-cs301",
      "day_of_week": "Thursday",
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "room": "Room 202"
    },
    {
      "id": "tt-cseb-fri-1",
      "class_id": "cls-cse-b",
      "teacher_id": "tch-t003",
      "subject_id": "sub-cs303",
      "day_of_week": "Friday",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "room": "Room 202"
    },
    {
      "id": "tt-csec-mon-1",
      "class_id": "cls-cse-c",
      "teacher_id": "tch-t002",
      "subject_id": "sub-cs302",
      "day_of_week": "Monday",
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "room": "Room 203"
    },
    {
      "id": "tt-csec-mon-2",
      "class_id": "cls-cse-c",
      "teacher_id": "tch-t003",
      "subject_id": "sub-cs303",
      "day_of_week": "Monday",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "room": "Room 203"
    },
    {
      "id": "tt-csec-tue-1",
      "class_id": "cls-cse-c",
      "teacher_id": "tch-t004",
      "subject_id": "sub-cs304",
      "day_of_week": "Tuesday",
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "room": "Room 203"
    },
    {
      "id": "tt-csec-tue-2",
      "class_id": "cls-cse-c",
      "teacher_id": "tch-t002",
      "subject_id": "sub-cs302",
      "day_of_week": "Tuesday",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "room": "Room 203"
    },
    {
      "id": "tt-csec-wed-1",
      "class_id": "cls-cse-c",
      "teacher_id": "tch-t003",
      "subject_id": "sub-cs303",
      "day_of_week": "Wednesday",
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "room": "Room 203"
    },
    {
      "id": "tt-csec-wed-2",
      "class_id": "cls-cse-c",
      "teacher_id": "tch-t004",
      "subject_id": "sub-cs304",
      "day_of_week": "Wednesday",
      "start_time": "11:00:00",
      "end_time": "12:00:00",
      "room": "Room 203"
    },
    {
      "id": "tt-csec-thu-1",
      "class_id": "cls-cse-c",
      "teacher_id": "tch-t002",
      "subject_id": "sub-cs302",
      "day_of_week": "Thursday",
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "room": "Room 203"
    },
    {
      "id": "tt-csec-fri-1",
      "class_id": "cls-cse-c",
      "teacher_id": "tch-t003",
      "subject_id": "sub-cs303",
      "day_of_week": "Friday",
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "room": "Room 203"
    },
    {
      "id": "tt-csec-fri-2",
      "class_id": "cls-cse-c",
      "teacher_id": "tch-t004",
      "subject_id": "sub-cs304",
      "day_of_week": "Friday",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "room": "Room 203"
    }
  ],
  "attendance_rules": [
    {
      "id": "rule-1",
      "name": "Low Attendance Warning",
      "threshold_percent": 80,
      "consecutive_absences": 2,
      "action": "STUDENT_WARNING",
      "target_role": "student",
      "enabled": true
    },
    {
      "id": "rule-2",
      "name": "Defaulter Alert",
      "threshold_percent": 75,
      "consecutive_absences": 3,
      "action": "FACULTY_ALERT",
      "target_role": "teacher",
      "enabled": true
    },
    {
      "id": "rule-3",
      "name": "Critical Escalation",
      "threshold_percent": 70,
      "consecutive_absences": 4,
      "action": "HOD_ESCALATION",
      "target_role": "hod",
      "enabled": true
    }
  ],
  "notifications": [
    {
      "id": "n1",
      "user_id": "usr-t001",
      "role": "teacher",
      "title": "Welcome Priya Sharma",
      "body": "DBMS & DS teacher assignments ready for CSE-A and CSE-B.",
      "time_str": "Today",
      "unread": true
    },
    {
      "id": "n2",
      "user_id": "usr-hod001",
      "role": "hod",
      "title": "Department Seeded",
      "body": "CSE Department initialized with 3 divisions (A, B, C) and 45 students.",
      "time_str": "Today",
      "unread": true
    }
  ]
};

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
