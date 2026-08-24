"""Fake attendance data generator for AntiProxy.

Generates realistic fake attendance data for ~30 students across 2 divisions,
5 subjects, 12 weeks, with 2 classes/subject/week.
Each student follows one of 5 behavior profiles:
- stable_good (~93% present)
- stable_average (~80% present)
- declining (starts ~92%, drops to ~47% by end of term)
- improving (starts ~55%, rises to ~90% by end of term)
- chronic_absentee (~45% flat)

Output format:
student_id, name, division, subject, session_date, status
"""

import os
from datetime import datetime, timedelta
import numpy as np
import pandas as pd


STUDENT_NAMES = [
    # CSE-A (15 students)
    "Aarav Sharma", "Aditi Patel", "Arjun Nair", "Ananya Iyer", "Devansh Gupta",
    "Diya Sengupta", "Ishaan Verma", "Kavya Reddy", "Manish Joshi", "Meera Pillai",
    "Nikhil Rao", "Pooja Kulkarni", "Pranav Mehta", "Riya Deshmukh", "Rohan Malhotra",
    # CSE-B (15 students)
    "Saanvi Bhat", "Samarth Jain", "Shreya Mane", "Siddharth Das", "Sneha Roy",
    "Sparsh Kapoor", "Tanvi Agrawal", "Utkarsh Sinha", "Vaishnavi Patil", "Varun Chopra",
    "Vedant Shinde", "Vidya Nambiar", "Yash Kadam", "Zara Khan", "Aryan Saxena"
]

SUBJECTS = [
    "Operating Systems",
    "Computer Networks",
    "Database Management Systems",
    "Software Engineering",
    "Machine Learning"
]

BEHAVIOR_PROFILES = [
    "stable_good",
    "stable_average",
    "declining",
    "improving",
    "chronic_absentee"
]


def get_presence_probability(profile: str, week_idx: int, total_weeks: int = 12) -> float:
    """Calculate presence probability for a behavior profile at a given week."""
    t = week_idx / max(1, total_weeks - 1)  # Normalized 0.0 to 1.0
    if profile == "stable_good":
        return 0.93
    elif profile == "stable_average":
        return 0.80
    elif profile == "declining":
        return 0.92 - (0.92 - 0.47) * t
    elif profile == "improving":
        return 0.55 + (0.90 - 0.55) * t
    elif profile == "chronic_absentee":
        return 0.45
    return 0.75


def generate_attendance_dataframe(seed: int = 42) -> pd.DataFrame:
    """Generate the full synthetic attendance dataset."""
    np.random.seed(seed)
    
    students = []
    for i, name in enumerate(STUDENT_NAMES):
        division = "CSE-A" if i < 15 else "CSE-B"
        student_id = f"STU{i + 1:03d}"
        profile = BEHAVIOR_PROFILES[i % len(BEHAVIOR_PROFILES)]
        students.append({
            "student_id": student_id,
            "name": name,
            "division": division,
            "profile": profile
        })
    
    total_weeks = 12
    start_date = datetime(2026, 1, 5)  # First Monday
    
    records = []
    
    for week in range(total_weeks):
        week_start = start_date + timedelta(weeks=week)
        
        # Schedule: 2 sessions per subject per week across Monday-Friday
        # Mon: OS (09:00), CN (11:00)
        # Tue: DBMS (09:00), SE (11:00)
        # Wed: ML (09:00), OS (11:00)
        # Thu: CN (09:00), DBMS (11:00)
        # Fri: SE (09:00), ML (11:00)
        weekly_sessions = [
            (0, 9, "Operating Systems"),
            (0, 11, "Computer Networks"),
            (1, 9, "Database Management Systems"),
            (1, 11, "Software Engineering"),
            (2, 9, "Machine Learning"),
            (2, 11, "Operating Systems"),
            (3, 9, "Computer Networks"),
            (3, 11, "Database Management Systems"),
            (4, 9, "Software Engineering"),
            (4, 11, "Machine Learning")
        ]
        
        for day_offset, hour, subject in weekly_sessions:
            session_dt = week_start + timedelta(days=day_offset, hours=hour)
            session_date_str = session_dt.strftime("%Y-%m-%d %H:%M:%S")
            
            for student in students:
                p = get_presence_probability(student["profile"], week, total_weeks)
                is_present = np.random.rand() < p
                status = "present" if is_present else "absent"
                
                records.append({
                    "student_id": student["student_id"],
                    "name": student["name"],
                    "division": student["division"],
                    "subject": subject,
                    "session_date": session_date_str,
                    "status": status
                })
    
    df = pd.DataFrame(records)
    # Ensure sorted order
    df = df.sort_values(by=["session_date", "student_id"]).reset_index(drop=True)
    return df


def save_fake_data(output_dir: str = None) -> str:
    """Generate fake data and save both full and sample CSVs."""
    if output_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(base_dir, "data")
    
    os.makedirs(output_dir, exist_ok=True)
    df = generate_attendance_dataframe()
    
    full_path = os.path.join(output_dir, "fake_attendance.csv")
    sample_path = os.path.join(output_dir, "sample_attendance.csv")
    
    df.to_csv(full_path, index=False)
    # Keep 25 rows for sample attendance
    df.head(25).to_csv(sample_path, index=False)
    
    print(f"Generated {len(df)} records across {df['student_id'].nunique()} students.")
    print(f"Full dataset saved to: {full_path}")
    print(f"Sample dataset saved to: {sample_path}")
    return full_path


if __name__ == "__main__":
    save_fake_data()
