# AntiProxy — Multi-Factor Attendance Verification Engine 🚀

AntiProxy is a modern, high-security multi-factor attendance verification web application designed to eliminate proxy attendance in educational institutions. It enforces a strict **3-Step Verification Pipeline** before recording any student attendance:

1. 📶 **Bluetooth Low Energy (BLE) Proximity Check** — Verifies student physical presence in the classroom.
2. ⏱️ **30-Second Dynamic TOTP QR Scan** — HMAC SHA-256 encrypted QR codes rotating every 30 seconds to prevent photo sharing/proxies.
3. 👤 **Face & Liveness Identity Match** — On-device biometric identity check (face embedding match + active liveness challenge) to confirm student identity before attendance is recorded.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, jsQR (browser-native QR frame decoder), Lucide Icons, React Hot Toast
- **Face Recognition & Liveness**: [face-api.js](https://github.com/justadudewhohacks/face-api.js) (128-d face descriptor generation) + [MediaPipe Tasks Vision — FaceLandmarker](https://developers.google.com/mediapipe/solutions/vision/face_landmarker) (468-point 3D facial landmarks for active liveness detection). Model weights are bundled in the repo — no separate download required.
- **Backend**: Node.js, Express, PostgreSQL, JSON Web Tokens (JWT), Bcrypt, SHA-256 HMAC Crypto
- **Database**: PostgreSQL (with in-memory fallback for offline testing) + **pgvector** extension for storing and matching 128-dimensional face embeddings via Euclidean distance (`<->`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** (v9 or higher)
- **pgvector extension** for PostgreSQL — required for storing face embeddings (see [Face Recognition Setup](#-face-recognition-setup) below)
- A **webcam** and a **Chromium/Firefox-based browser** — required for face registration and face verification during attendance
- **Bluetooth** enabled on the testing device — required for the proximity check step

---

## 🗄️ Database Setup (PostgreSQL)

### Step 1: Install the pgvector Extension

The `face_profiles` table stores each student's face embedding as a `vector(128)` column, and matching is done with pgvector's `<->` distance operator. The extension must be installed **on the PostgreSQL server itself** before the schema is imported.

```bash
# Debian/Ubuntu (adjust the version suffix to match your installed PostgreSQL version)
sudo apt install postgresql-16-pgvector

# macOS (Homebrew)
brew install pgvector

# Or build from source (any OS with PostgreSQL dev headers installed)
git clone --branch v0.7.4 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

> If you're using a managed/cloud Postgres provider (Supabase, Neon, RDS, etc.), check that pgvector is available/enabled for your instance instead of installing it manually — most modern providers support it out of the box.

### Step 2: Create Database
Open your terminal or PostgreSQL CLI (`psql`) and execute:

```bash
# Using PostgreSQL CLI command
createdb -U postgres antiproxy

# OR via psql console:
# psql -U postgres
# CREATE DATABASE antiproxy;
```

### Step 3: Import Database Schema & Seed Data

Navigate to the project root directory and run the SQL files using `psql`. `schema.sql` runs `CREATE EXTENSION IF NOT EXISTS vector;` automatically as its first statement, so as long as pgvector is installed (Step 1), this will just work.

```bash
# 1. Import Table Schema (also enables the pgvector extension on the `antiproxy` DB)
psql -U postgres -d antiproxy -f backend/src/db/schema.sql

# 2. Import Seed Data (Teachers, Students, Classes, Subjects & Enrollments)
psql -U postgres -d antiproxy -f backend/src/db/seed.sql
```

*(Alternatively, you can run `npm run seed` inside the `backend/` folder to populate seed data via Node.js).*

> ⚠️ If Step 1 was skipped, this step will fail with `ERROR: extension "vector" is not available`. Install pgvector and retry.

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

No additional environment variables are needed for face recognition — embeddings are generated entirely client-side in the browser and sent to the backend as a plain 128-number array; the backend only stores/compares them.

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

The face-api.js model weights (`frontend/public/models/`) and the MediaPipe WASM runtime (`frontend/public/wasm/`) are already committed to this repo, so `npm install` + `npm run dev` is all that's needed — there's no separate model download step.

---

## 🎭 Face Recognition Setup

The face pipeline runs almost entirely **in the browser**, using two libraries in tandem:

| Purpose | Library | Assets used |
| :--- | :--- | :--- |
| Face detection + 128-d identity embedding | `face-api.js` | `frontend/public/models/*` (SSD Mobilenet, Tiny Face Detector, 68-point landmarks, Face Recognition net) |
| 3D landmark tracking for active liveness (head-turn / blink motion analysis) | `@mediapipe/tasks-vision` FaceLandmarker | `frontend/public/models/face_landmarker.task`, `frontend/public/wasm/*` |

**How it works end-to-end:**
1. On the `Register Face` page (`/student/face-registration`), the browser loads both model sets, captures a neutral frame and a "challenge" frame (e.g. head turn), and verifies genuine motion occurred between them using landmark displacement (`frontend/src/utils/livenessCheck.js`) — this blocks static photo/screen spoofing.
2. `face-api.js` then generates a 128-dimensional descriptor from the captured face (`frontend/src/utils/faceEmbedding.js`) and the browser sends it to `POST /api/students/:studentId/face-profile`, which upserts it into the `face_profiles` table as a `vector(128)`.
3. During attendance marking (Step 3 of the verification pipeline), the same liveness + embedding flow runs again, and the live embedding is compared against the stored profile using pgvector's Euclidean distance operator (`backend/src/services/faceService.js`). A distance below `0.6` is considered a match.

**Things to know before testing:**
- **Camera permissions**: your browser will prompt for webcam access on the registration and attendance pages — allow it. `getUserMedia` works over plain HTTP on `localhost`, so no HTTPS/SSL setup is needed for local development.
- **GPU delegate fallback**: MediaPipe FaceLandmarker requests a GPU delegate by default. On browsers/machines without WebGL support it may need to fall back to CPU — if face detection seems unusually slow, try Chrome/Edge rather than Safari.
- **Each student must register their face once** (via `/student/face-registration`) before they can complete face verification during attendance — otherwise the pipeline returns `FACE_NOT_REGISTERED`.
- A `Face Detection Test` debug page exists at `frontend/src/pages/dev/FaceDetectionTest.jsx` if you want to sanity-check model loading in isolation.

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

> Seeded students do **not** come with a pre-registered face profile — you'll need to register a face for whichever student account you test with (see Step 0 below).

---

## 🧪 Testing the Attendance Verification Flow

0. **Register a Face Profile (one-time, per student)**:
   - Log in as e.g. `student.b02@antiproxy.dev` / `Student@123`.
   - Navigate to **Register Face** (`/student/face-registration`).
   - Wait for the models to finish loading, allow camera access, hold steady for the neutral capture, then follow the on-screen liveness prompt (e.g. turn your head) for the challenge capture.
   - On success, the 128-d embedding is saved to your face profile.

1. **Teacher Creates Session**:
   - Log in as `ananya.rao@antiproxy.dev` / `Teacher@123`.
   - Click on any active lecture slot (e.g. `CSE-B` - `Database Management Systems`) on the timetable grid.
   - Click **START ATTENDANCE**. The 30-second rotating Dynamic QR code will display.

2. **Student Scans / Uploads QR**:
   - Open a separate browser window/tab and log in as `student.b02@antiproxy.dev` / `Student@123`.
   - Click on the active session banner or timetable lecture.
   - **Step 1**: Connect to Classroom Bluetooth.
   - **Step 2**: Click **Scan with Camera** (or **Upload QR Image**) to scan the teacher's active QR.
   - **Step 3**: Complete the liveness challenge and capture your face for identity match, then click **Mark Attendance**. The live embedding is matched against the profile registered in Step 0.

3. **Wrong Class Test (`NOT_YOUR_CLASS`)**:
   - Log in as a Division CSE-A student (`student.a01@antiproxy.dev` / `Student@123`).
   - Attempt to scan the teacher's `CSE-B` lecture QR.
   - The backend will reject the request with `NOT_YOUR_CLASS`: *"This session is for class CSE-B. Your assigned class is CSE-A."*

4. **Face Mismatch / Not Registered Test**:
   - Attempt Step 3 above with a student who hasn't completed Step 0 — expect `FACE_NOT_REGISTERED`.
   - Attempt Step 3 while a different person's face is in frame than the one registered — expect `FACE_NO_MATCH`.

---

## 📁 Project Structure

```
AntiProxy/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql      # PostgreSQL DDL Table Schemas (incl. pgvector extension + face_profiles)
│   │   │   ├── seed.sql        # Seed Insert Statements for Demo
│   │   │   ├── seed.js         # Automated Seeder script
│   │   │   └── db.js           # PostgreSQL Connection Pool & Failover
│   │   ├── middleware/         # Auth & Role RBAC Middleware
│   │   ├── routes/             # REST API Routes (Auth, Attendance, Devices, Face Profile)
│   │   └── services/           # TOTP QR Engine, BLE Proximity, Face Engine (pgvector match)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── models/              # face-api.js model weights + MediaPipe face_landmarker.task
│   │   └── wasm/                # MediaPipe Tasks Vision WASM runtime
│   ├── src/
│   │   ├── components/         # CameraCapture, Dynamic QR Display, Modals
│   │   ├── context/            # Auth & Attendance React Context
│   │   ├── pages/               # Student, Teacher & HOD Dashboards, Face Registration, Mark Attendance
│   │   │   └── dev/             # FaceDetectionTest — debug page for model loading
│   │   └── utils/               # API Client, jsQR Decoder, faceEmbedding.js, faceDetection.js, livenessCheck.js
│   └── package.json
└── README.md
```