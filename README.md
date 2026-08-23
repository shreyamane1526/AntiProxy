# AntiProxy - Secure College Attendance Platform (Full-Stack)

AntiProxy is an enterprise college attendance verification platform featuring:
**Live Dynamic QR Codes (30-second auto-rotation) + 5-Minute Classroom Sessions + Role-Based Portals + Dark Mode**.

---

## ⚡ Quick Start Guide (For First-Time Cloners)

Follow these simple steps to run AntiProxy locally on your machine:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

---

### Step 1: Start the Backend Server (Port 4000)
Open a terminal in the project root:
```bash
cd backend
npm install
npm start
```
> **Note:** The backend automatically runs an in-memory seed database out of the box so you do **not** need to install or set up PostgreSQL!

---

### Step 2: Start the Frontend App (Port 5173)
Open a **second** terminal window:
```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser!

---

## 🔑 Demo User Credentials

| Role | Email | Password | What You Can Do |
|---|---|---|---|
| **FACULTY (Teacher)** | `r.mehta@college.edu` | `demo` | Select Class & Subject, Start 5-min Session, Project live 30-sec rotating QR |
| **STUDENT** | `aanya.sharma@college.edu` | `demo` | View Student Dashboard, Analytics, Attendance planner, Profile |
| **HOD** | `hod.cse@college.edu` | `demo` | Monitor Department attendance & Defaulter stats |

---

## 🌟 Key Features

1. **Teacher Dynamic QR Generation**:
   - Select Class Section & Subject to start a 5-minute active classroom session.
   - Generates high-contrast, projector-ready **scannable QR codes** using HMAC signatures.
   - QR code **auto-rotates every 30 seconds** with a 3–5 second network grace period.
   - Real-time 5-minute session timer & manual **END ATTENDANCE** button.
2. **Dark Mode & Theme Persistence**:
   - System theme detection + one-click theme switcher in navbar/sidebar.
3. **Role-Based Portals & Analytics**:
   - Separate dashboards for Students, Teachers, and HODs.
   - Interactive subject attendance charts, risk intelligence, and class planners.

---

## 📁 Repository Structure

```
AntiProxy/
├── frontend/             # React 19 + Vite 8 + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/   # UI components (Sidebar, ThemeToggle, Modal, etc.)
│   │   ├── pages/        # Teacher, Student, and HOD dashboards
│   │   ├── context/      # AuthContext & ThemeContext
│   │   └── utils/        # API client & helpers
│   └── package.json
└── backend/              # Node.js + Express backend API
    ├── src/
    │   ├── index.js      # Express server entry point
    │   ├── routes/       # Auth, Attendance, Devices, Analytics, Risk routes
    │   ├── services/     # QrService (30s TOTP-HMAC), VerificationEngine
    │   ├── db/           # In-memory DB + PostgreSQL schema & seed scripts
    │   └── middleware/   # JWT auth & RBAC middleware
    └── package.json
```

---

## 📡 Key API Endpoints

- `POST /api/attendance/sessions` — Start 5-minute attendance session
- `GET /api/attendance/sessions/:id/qr` — Get current 30-second dynamic QR payload
- `POST /api/attendance/sessions/:id/end` — End active attendance session
- `POST /api/auth/login` — Authenticate user & issue JWT
- `GET /api/auth/me` — Fetch authenticated user details

