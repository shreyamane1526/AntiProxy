-- PostgreSQL Database Schema for AntiProxy Attendance Engine

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('student', 'teacher', 'hod', 'admin')),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(32) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roll_no VARCHAR(64) UNIQUE NOT NULL,
  division VARCHAR(32) NOT NULL,
  year VARCHAR(64) NOT NULL,
  programme VARCHAR(255) NOT NULL,
  photo_url TEXT
);

CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id VARCHAR(64) REFERENCES departments(id) ON DELETE SET NULL,
  designation VARCHAR(255) NOT NULL,
  employee_id VARCHAR(64) UNIQUE NOT NULL,
  photo_url TEXT
);

CREATE TABLE IF NOT EXISTS hods (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id VARCHAR(64) REFERENCES departments(id) ON DELETE SET NULL,
  designation VARCHAR(255) NOT NULL,
  photo_url TEXT
);

CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id VARCHAR(64) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(64) PRIMARY KEY,
  department_id VARCHAR(64) REFERENCES departments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64) NOT NULL,
  division VARCHAR(32) NOT NULL,
  type VARCHAR(32) DEFAULT 'Lecture'
);

CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  teacher_id VARCHAR(64) REFERENCES teachers(id) ON DELETE SET NULL,
  division VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
  id VARCHAR(64) PRIMARY KEY,
  teacher_id VARCHAR(64) NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id VARCHAR(64) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id VARCHAR(64) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE(teacher_id, subject_id, class_id)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id VARCHAR(64) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE(student_id, class_id)
);

CREATE TABLE IF NOT EXISTS registered_devices (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  device_name VARCHAR(255) NOT NULL,
  device_identifier VARCHAR(255) NOT NULL,
  status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id VARCHAR(64) PRIMARY KEY,
  session_code VARCHAR(64) NOT NULL,
  teacher_id VARCHAR(64) NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id VARCHAR(64) REFERENCES classes(id) ON DELETE SET NULL,
  subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE,
  room VARCHAR(128) NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  session_secret VARCHAR(255) NOT NULL,
  status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ENDED', 'EXPIRED', 'CLOSED', 'OPEN', 'active', 'ended', 'expired', 'closed', 'open')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  slot_day VARCHAR(20),
  slot_hour INTEGER
);

CREATE TABLE IF NOT EXISTS attendance_attempts (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id VARCHAR(64) NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  device_identifier VARCHAR(255),
  qr_status VARCHAR(32) NOT NULL,
  device_status VARCHAR(32) NOT NULL,
  ble_status VARCHAR(32) NOT NULL,
  liveness_status VARCHAR(32) NOT NULL,
  face_status VARCHAR(32) NOT NULL,
  final_status VARCHAR(32) NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id VARCHAR(64) NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(32) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused')),
  verification_attempt_id VARCHAR(64) REFERENCES attendance_attempts(id) ON DELETE SET NULL,
  CONSTRAINT unique_student_session UNIQUE (student_id, session_id)
);

CREATE TABLE IF NOT EXISTS verification_logs (
  id VARCHAR(64) PRIMARY KEY,
  attempt_id VARCHAR(64) NOT NULL REFERENCES attendance_attempts(id) ON DELETE CASCADE,
  step VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_rules (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  threshold_percent NUMERIC(5, 2) NOT NULL,
  consecutive_absences INT DEFAULT 0,
  action VARCHAR(128) NOT NULL,
  target_role VARCHAR(32) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS timetables (
  id VARCHAR(64) PRIMARY KEY,
  class_id VARCHAR(64) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id VARCHAR(64) NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id VARCHAR(64) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  day_of_week VARCHAR(16) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(64) NOT NULL
);


CREATE TABLE IF NOT EXISTS risk_scores (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  score_level VARCHAR(32) NOT NULL CHECK (score_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  reasons TEXT NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  time_str VARCHAR(128) NOT NULL,
  unread BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
