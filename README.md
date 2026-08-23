# AntiProxy — Multi-Factor Attendance Verification Engine 🚀

AntiProxy is a modern, high-security multi-factor attendance verification web application designed to eliminate proxy attendance in educational institutions. It enforces a strict **3-Step Verification Pipeline** before recording any student attendance:

1. 📶 **Bluetooth Low Energy (BLE) Proximity Check** — Verifies student physical presence in the classroom.
2. ⏱️ **30-Second Dynamic TOTP QR Scan** — HMAC SHA-256 encrypted QR codes rotating every 30 seconds to prevent photo sharing/proxies.
3. 👤 **Face & Liveness Identity Match** — Biometric identity check to confirm student identity.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, jsQR (browser-native QR frame decoder), Lucide Icons, React Hot Toast
- **Backend**: Node.js, Express, PostgreSQL, JSON Web Tokens (JWT), Bcrypt, SHA-256 HMAC Crypto
- **Database**: PostgreSQL (with in-memory fallback for offline testing)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** (v9 or higher)

---

## 🗄️ Database Setup (PostgreSQL)

### Step 1: Create Database
Open your terminal or PostgreSQL CLI (`psql`) and execute:

```bash
# Using PostgreSQL CLI command
createdb -U postgres antiproxy

# OR via psql console:
# psql -U postgres
# CREATE DATABASE antiproxy;
```

### Step 2: Import Database Schema & Seed Data

Navigate to the project root directory and run the SQL files using `psql`:

```bash
# 1. Import Table Schema
psql -U postgres -d antiproxy -f backend/src/db/schema.sql

# 2. Import Seed Data (Teachers, Students, Classes, Subjects & Enrollments)
psql -U postgres -d antiproxy -f backend/src/db/seed.sql
```

*(Alternatively, you can run `npm run seed` inside the `backend/` folder to populate seed data via Node.js).*

---

## ⚙️ Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create environment file (.env)
cp .env.example .env

# Configure your database connection in backend/.env:
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/antiproxy
# PORT=4000
# JWT_SECRET=antiproxy_jwt_secret_key_2026_production

# 4. Start the backend development server
npm run dev
```
The Express backend server will run at: `http://localhost:4000`

---

## 💻 Frontend Setup

```bash
# 1. Navigate to frontend directory (from project root)
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev
```
The React frontend web application will run at: `http://localhost:5173`

---

## 🔑 Pre-Configured Seed Logins

Use these credentials to test the application flows across different user roles:

| Role | Email | Password | Details / Assigned Division |
| :--- | :--- | :--- | :--- |
| **Teacher** | `ananya.rao@antiproxy.dev` | `Teacher@123` | Dr. Ananya Rao (DBMS & Computer Networks) |
| **Teacher** | `vikram.aditya@antiproxy.dev` | `Teacher@123` | Prof. Vikram Aditya (Data Structures) |
| **Student** | `student.b02@antiproxy.dev` | `Student@123` | Anya Verma (Division **CSE-B**) |
| **Student** | `student.b01@antiproxy.dev` | `Student@123` | Aarav Sharma (Division **CSE-B**) |
| **Student** | `student.b03@antiproxy.dev` | `Student@123` | Rohan Gupta (Division **CSE-B**) |
| **Student** | `student.a01@antiproxy.dev` | `Student@123` | Riya Sen (Division **CSE-A**) |
| **Student** | `student.a02@antiproxy.dev` | `Student@123` | Dev Patel (Division **CSE-A**) |
| **HOD** | `hod.cse@antiproxy.dev` | `Hod@123` | Head of Department (CSE) |
| **Admin** | `admin@antiproxy.dev` | `Admin@123` | System Administrator |

---

## 🧪 Testing the Attendance Verification Flow

1. **Teacher Creates Session**:
   - Log in as `ananya.rao@antiproxy.dev` / `Teacher@123`.
   - Click on any active lecture slot (e.g. `CSE-B` - `Database Management Systems`) on the timetable grid.
   - Click **START ATTENDANCE**. The 30-second rotating Dynamic QR code will display.

2. **Student Scans / Uploads QR**:
   - Open a separate browser window/tab and log in as `student.b02@antiproxy.dev` / `Student@123`.
   - Click on the active session banner or timetable lecture.
   - **Step 1**: Connect to Classroom Bluetooth.
   - **Step 2**: Click **Scan with Camera** (or **Upload QR Image**) to scan the teacher's active QR.
   - **Step 3**: Capture face for identity match and click **Mark Attendance**.

3. **Wrong Class Test (`NOT_YOUR_CLASS`)**:
   - Log in as a Division CSE-A student (`student.a01@antiproxy.dev` / `Student@123`).
   - Attempt to scan the teacher's `CSE-B` lecture QR.
   - The backend will reject the request with `NOT_YOUR_CLASS`: *"This session is for class CSE-B. Your assigned class is CSE-A."*

---

## 📁 Project Structure

```
AntiProxy/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql      # PostgreSQL DDL Table Schemas
│   │   │   ├── seed.sql        # Seed Insert Statements for Demo
│   │   │   ├── seed.js         # Automated Seeder script
│   │   │   └── db.js           # PostgreSQL Connection Pool & Failover
│   │   ├── middleware/         # Auth & Role RBAC Middleware
│   │   ├── routes/             # REST API Routes (Auth, Attendance, Devices)
│   │   └── services/           # TOTP QR Engine, BLE Proximity, Face Engine
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # CameraCapture, Dynamic QR Display, Modals
│   │   ├── context/            # Auth & Attendance React Context
│   │   ├── pages/              # Student, Teacher & HOD Dashboards & Mark Attendance
│   │   └── utils/              # API Client & Browser jsQR Decoder
│   └── package.json
└── README.md
```
