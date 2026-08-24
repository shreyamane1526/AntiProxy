# AntiProxy Analytics & Risk Intelligence Module

The **AntiProxy Analytics & Risk Intelligence Module** is a standalone Python microservice designed for attendance analytics, explainable defaulter risk scoring, and machine learning anomaly detection for the **AntiProxy** multi-factor attendance verification ecosystem.

Operating independently of the React frontend and Node.js/Express backend, it processes attendance records into actionable risk intelligence and exposes them through a high-performance FastAPI REST API.

---

## 🏛️ System Architecture & Context

AntiProxy is a multi-tier attendance verification system:
1. **Verification Tier (React Mobile/Web)**: Students scan dynamic QR codes, verify BLE proximity, and undergo face/liveness checks.
2. **Operational Backend (Node.js/Express + PostgreSQL)**: Authenticates users, validates real-time attendance sessions, and writes records to PostgreSQL.
3. **Analytics & Risk Intelligence (This Python Microservice :8001)**: Ingests attendance history, computes attendance trends, runs transparent 0–100 risk scoring, flags anomalies via ML, and serves risk rankings to student apps and teacher dashboards.

```mermaid
flowchart TD
    subgraph ClientLayer["1. Client Layer (React UI)"]
        StudentApp["Student Mobile App<br/>(BLE + Dynamic QR + Face Scan)"]
        TeacherPortal["Teacher / HOD Dashboard<br/>(Live Class & Defaulter Reports)"]
    end

    subgraph OperationalBackend["2. Operational Backend (Express)"]
        ExpressAPI["Node.js / Express API"]
        PostgresDB[("PostgreSQL Database<br/>(students, sessions, records)")]
    end

    subgraph IntelligenceService["3. Analytics & Intelligence (Python Microservice :8001)"]
        FastAPI["FastAPI REST Server"]
        AnalyticsEngine["Analytics Engine<br/>(% attendance, trends, safe miss buffer)"]
        RiskEngine["Rule-Based Risk Engine<br/>(0–100 Defaulter Risk & Breakdown)"]
        MLEngine["ML & Anomaly Detection<br/>(RandomForest + IsolationForest)"]
    end

    StudentApp -->|Verify Attendance| ExpressAPI
    TeacherPortal -->|Query Analytics & Reports| ExpressAPI
    ExpressAPI -->|Persist Attendance Records| PostgresDB
    ExpressAPI -->|HTTP GET /analytics/... & /risk/...| FastAPI
    FastAPI --> AnalyticsEngine
    FastAPI --> RiskEngine
    FastAPI --> MLEngine
```

---

## 🎯 What Problem Does This Module Solve?

Traditional attendance systems only count raw percentages after the term is over. This module provides **proactive early warning intelligence**:

| Stakeholder | Practical Problem | Solution Provided by This Module |
| :--- | :--- | :--- |
| **Student** | *"How many classes can I miss safely?"* | Calculates exact safe missable class buffer without falling below 75%. |
| **Student** | *"How many classes must I attend to get back above 75%?"* | Calculates the exact catch-up quota of consecutive classes to attend. |
| **Teacher** | *"Who is actively deteriorating?"* | Evaluates 30-day vs. prior 30-day velocity (`improving`, `declining`, `stable`). |
| **Mentor** | *"Why is this student flagged as high risk?"* | Transparent weighted breakdown showing gap, trend, streak, and recent absences. |
| **HOD / Dean** | *"Which students need immediate intervention?"* | Class-wide risk ranking sorted highest-risk first. |

---

## ⚖️ Transparent Risk Engine Formula

The rule-based risk engine computes a **0–100 Defaulter Risk Score** with **`LOW`** (<30), **`MEDIUM`** (30–59), and **`HIGH`** ($\ge$60) levels using a four-factor formula:

$$\text{Risk Score} = 0.40 \times \text{Gap Below Threshold} + 0.25 \times \text{Downtrend Delta} + 0.20 \times \text{Consecutive Absences} + 0.15 \times \text{Recent Absences}$$

- **Attendance Gap (Weight 0.40)**: Penalty for falling below 75% attendance threshold.
- **Trend Deterioration (Weight 0.25)**: Rate of attendance drop over the last 30 days.
- **Consecutive Absences (Weight 0.20)**: Current active absence streak (5+ absences = max penalty).
- **Recent Absences (Weight 0.15)**: Unexcused absences in the student's last 10 sessions.

---

## 🤖 Machine Learning Augmentation

- **Random Forest Classifier**: Multi-feature classifier trained on `[attendance_pct, trend_delta, consecutive_absences, recent_absence_count, subjects_below_threshold]` to predict defaulter probability.
- **Isolation Forest**: Unsupervised model that identifies anomaly patterns (e.g. sudden behavioral drops or irregular attendance bursts).
- **Principle**: ML results are delivered **side-by-side** with transparent rule-based scores to ensure explainability.

---

## 📁 Folder Structure

```
antiproxy-analytics/
├── .env                         # Active configuration (DATA_SOURCE=fake|postgres, PORT=8001)
├── .env.example                 # Template for environment variables
├── .gitignore                   # Ignores __pycache__, .env, venv, fake_attendance.csv (tracks sample)
├── requirements.txt             # Project dependencies
├── README.md                    # Module documentation and usage guide
├── data/
│   ├── fake_attendance.csv      # Generated synthetic dataset (3,600 records)
│   └── sample_attendance.csv    # Committed sample dataset (~25 rows) demonstrating flat schema
├── src/
│   ├── __init__.py
│   ├── generate_fake_data.py    # Realistic synthetic generator with 5 behavior profiles
│   ├── analytics.py             # Pure functional analytics engine
│   ├── risk_engine.py           # Transparent rule-based 0–100 risk scoring & breakdown
│   ├── ml_model.py              # Random Forest & Isolation Forest risk/anomaly models
│   ├── db.py                    # PostgreSQL relational loader & synthetic CSV reader
│   └── api.py                   # FastAPI REST API endpoints
└── tests/
    ├── __init__.py
    ├── test_analytics.py        # Deterministic unit tests with exact fixture assertions
    ├── test_risk_engine.py      # Risk engine weights, boundaries, and ranking tests
    └── test_api.py              # FastAPI route & 404 error handling tests
```

---

## 🚀 Setup & Running

### 1. Prerequisites
- Python 3.10+
- Virtual environment (recommended)

### 2. Installation
```bash
# Navigate to the module directory
cd antiproxy-analytics

# Create and activate a virtual environment
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Generate Synthetic Attendance Data
```bash
python src/generate_fake_data.py
```
This generates 3,600 attendance records across 30 students, 2 divisions (`CSE-A`, `CSE-B`), and 5 subjects with 5 behavior profiles (`stable_good`, `stable_average`, `declining`, `improving`, `chronic_absentee`).

### 4. Start the FastAPI Service
```bash
uvicorn src.api:app --host 0.0.0.0 --port 8001 --reload
```
- **Service URL**: `http://127.0.0.1:8001`
- **Interactive Swagger UI**: `http://127.0.0.1:8001/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8001/redoc`

---

## 🧪 Running Automated Tests

Run the complete 21-test automated suite using `pytest`:
```bash
pytest -v
```

---

## 📡 API Endpoints & Example cURL Calls

### 1. Service Overview & Health Check
```bash
# Service Overview
curl -X GET "http://127.0.0.1:8001/"

# Health Check
curl -X GET "http://127.0.0.1:8001/health"
```
**Sample Response (`GET /health`):**
```json
{
  "status": "ok",
  "service": "antiproxy-analytics",
  "data_source": "fake"
}
```

---

### 2. Student Attendance Analytics
```bash
curl -X GET "http://127.0.0.1:8001/analytics/student/STU001"
```
**Sample Response:**
```json
{
  "student_id": "STU001",
  "overall": {
    "student_id": "STU001",
    "name": "Aarav Sharma",
    "division": "CSE-A",
    "total_classes": 120,
    "attended_classes": 111,
    "attendance_pct": 92.5
  },
  "subject_wise": [
    {
      "subject": "Computer Networks",
      "total_classes": 24,
      "attended_classes": 23,
      "attendance_pct": 95.83
    },
    {
      "subject": "Database Management Systems",
      "total_classes": 24,
      "attended_classes": 22,
      "attendance_pct": 91.67
    },
    {
      "subject": "Machine Learning",
      "total_classes": 24,
      "attended_classes": 23,
      "attendance_pct": 95.83
    },
    {
      "subject": "Operating Systems",
      "total_classes": 24,
      "attended_classes": 23,
      "attendance_pct": 95.83
    },
    {
      "subject": "Software Engineering",
      "total_classes": 24,
      "attended_classes": 20,
      "attendance_pct": 83.33
    }
  ],
  "classes_can_miss": [
    {
      "subject": "Computer Networks",
      "attendance_pct": 95.83,
      "threshold": 75.0,
      "status": "safe",
      "classes_can_miss": 6,
      "classes_to_attend": 0
    },
    {
      "subject": "Database Management Systems",
      "attendance_pct": 91.67,
      "threshold": 75.0,
      "status": "safe",
      "classes_can_miss": 5,
      "classes_to_attend": 0
    }
  ],
  "trend": {
    "student_id": "STU001",
    "recent_pct": 97.73,
    "prior_pct": 93.18,
    "delta": 4.55,
    "trend": "improving",
    "window_days": 30
  },
  "consecutive_absences": 0,
  "recent_absences_last_10": 0
}
```

---

### 3. Rule-Based Student Defaulter Risk Assessment
```bash
curl -X GET "http://127.0.0.1:8001/risk/student/STU003"
```
**Sample Response:**
```json
{
  "student_id": "STU003",
  "name": "Arjun Nair",
  "division": "CSE-A",
  "risk_score": 42.12,
  "risk_level": "MEDIUM",
  "attendance_pct": 65.83,
  "breakdown": {
    "attendance_gap": {
      "score": 12.23,
      "weight": 0.4,
      "contribution": 4.89,
      "attendance_pct": 65.83,
      "threshold": 75.0
    },
    "trend": {
      "score": 90.92,
      "weight": 0.25,
      "contribution": 22.73,
      "delta": -22.73,
      "trend_direction": "declining"
    },
    "consecutive_absences": {
      "score": 20.0,
      "weight": 0.2,
      "contribution": 4.0,
      "streak": 1
    },
    "recent_absences": {
      "score": 70.0,
      "weight": 0.15,
      "contribution": 10.5,
      "absent_count": 7,
      "evaluated_classes": 10
    }
  }
}
```

---

### 4. Comparative ML Risk Assessment & Anomaly Detection
```bash
curl -X GET "http://127.0.0.1:8001/risk/student/STU003/ml"
```
**Sample Response:**
```json
{
  "student_id": "STU003",
  "name": "Arjun Nair",
  "division": "CSE-A",
  "rule_based_risk": {
    "risk_score": 42.12,
    "risk_level": "MEDIUM"
  },
  "ml_risk": {
    "student_id": "STU003",
    "ml_risk_score": 47.0,
    "ml_predicted_level": "MEDIUM",
    "defaulter_probability": 0.94,
    "confidence": 0.94,
    "is_anomaly": false,
    "anomaly_score": 0.039,
    "model_type": "RandomForestClassifier + IsolationForest"
  },
  "comparison": {
    "rule_score": 42.12,
    "rule_level": "MEDIUM",
    "ml_score": 47.0,
    "ml_level": "MEDIUM",
    "defaulter_probability": 0.94,
    "is_anomaly": false
  }
}
```

---

### 5. Class Attendance Summary
```bash
curl -X GET "http://127.0.0.1:8001/analytics/class/CSE-A"
```
**Sample Response:**
```json
{
  "division": "CSE-A",
  "subject": null,
  "threshold": 75.0,
  "total_students": 15,
  "average_attendance_pct": 71.83,
  "students_below_threshold_count": 7,
  "students_below_threshold": [
    {
      "student_id": "STU010",
      "name": "Meera Pillai",
      "division": "CSE-A",
      "attendance_pct": 41.67
    },
    {
      "student_id": "STU005",
      "name": "Devansh Gupta",
      "division": "CSE-A",
      "attendance_pct": 43.33
    }
  ]
}
```

---

### 6. Class Risk Ranking (Highest Risk First)
```bash
curl -X GET "http://127.0.0.1:8001/risk/class/CSE-A"
```
**Sample Response:**
```json
{
  "division": "CSE-A",
  "total_students": 15,
  "high_risk_count": 0,
  "medium_risk_count": 4,
  "low_risk_count": 11,
  "students": [
    {
      "student_id": "STU005",
      "name": "Devansh Gupta",
      "division": "CSE-A",
      "risk_score": 50.39,
      "risk_level": "MEDIUM",
      "attendance_pct": 43.33
    },
    {
      "student_id": "STU003",
      "name": "Arjun Nair",
      "division": "CSE-A",
      "risk_score": 42.12,
      "risk_level": "MEDIUM",
      "attendance_pct": 65.83
    }
  ]
}
```

---

## 🗄️ Database Schema & Relational Query

### Assumed Database Schema
This module assumes the following relational schema in PostgreSQL:
```sql
students(id, name, division);
subjects(id, name);
enrollments(student_id, subject_id);
attendance_sessions(id, subject_id, division, teacher_id, session_date);
attendance_records(id, session_id, student_id, status);   -- status: 'present' | 'absent'
```

### Flat DataFrame Contract
The analytics engine consumes a flat pandas DataFrame:
`student_id, name, division, subject, session_date, status`

The SQL query in `src/db.py` (`load_data_from_postgres()`) executes:
```sql
SELECT
    s.id AS student_id,
    s.name,
    s.division,
    sub.name AS subject,
    sess.session_date,
    ar.status
FROM attendance_records ar
JOIN attendance_sessions sess ON ar.session_id = sess.id
JOIN students s ON ar.student_id = s.id
JOIN subjects sub ON sess.subject_id = sub.id
ORDER BY sess.session_date ASC, s.id ASC;
```

---

## 🔄 Switching DATA_SOURCE from Fake to PostgreSQL

To connect the microservice to a live PostgreSQL instance:

1. Open `.env` (or set system environment variables):
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/antiproxy
DATA_SOURCE=postgres
PORT=8001
```

2. Verify PostgreSQL is running and has attendance records populated.

3. Restart the service:
```bash
uvicorn src.api:app --host 0.0.0.0 --port 8001
```
The application will automatically query PostgreSQL via SQLAlchemy without requiring any changes to the analytics, risk, or ML code.
