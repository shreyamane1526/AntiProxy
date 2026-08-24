"""Unit tests for src/analytics.py using hand-crafted deterministic fixtures."""

import pytest
import pandas as pd
from datetime import datetime, timedelta

from src.analytics import (
    overall_attendance,
    subject_wise_attendance,
    classes_can_miss,
    attendance_trend,
    consecutive_absences,
    recent_absence_count,
    class_attendance_summary,
)


@pytest.fixture
def sample_attendance_df():
    """Hand-crafted deterministic fixture with known expected outcomes.
    
    Student STU001 (CSE-A):
    - OS: 5 classes (4 present, 1 absent) = 80.0%
    - CN: 5 classes (4 present, 1 absent) = 80.0%
    Total: 10 classes, 8 present = 80.0%
    
    Student STU002 (CSE-A):
    - OS: 5 classes (2 present, 3 absent) = 40.0%
    - CN: 5 classes (3 present, 2 absent) = 60.0%
    Total: 10 classes, 5 present = 50.0%
    
    Student STU003 (CSE-B):
    - OS: 10 classes (9 present, 1 absent) = 90.0%
    Total: 10 classes, 9 present = 90.0%
    """
    base_date = datetime(2026, 1, 1, 10, 0, 0)
    records = []
    
    # STU001: 8/10 present (80.0%)
    # Recent 3 classes are present
    stu1_statuses = [
        ("Operating Systems", "present", 1),
        ("Operating Systems", "present", 2),
        ("Operating Systems", "present", 3),
        ("Operating Systems", "absent", 4),
        ("Operating Systems", "present", 5),
        ("Computer Networks", "present", 6),
        ("Computer Networks", "absent", 7),
        ("Computer Networks", "present", 8),
        ("Computer Networks", "present", 9),
        ("Computer Networks", "present", 10),
    ]
    for subj, stat, day in stu1_statuses:
        dt = (base_date + timedelta(days=day)).strftime("%Y-%m-%d %H:%M:%S")
        records.append({
            "student_id": "STU001",
            "name": "Alice Smith",
            "division": "CSE-A",
            "subject": subj,
            "session_date": dt,
            "status": stat
        })
        
    # STU002: 5/10 present (50.0%)
    # Last 3 classes are absent
    stu2_statuses = [
        ("Operating Systems", "present", 1),
        ("Operating Systems", "present", 2),
        ("Operating Systems", "absent", 3),
        ("Operating Systems", "absent", 4),
        ("Operating Systems", "absent", 5),
        ("Computer Networks", "present", 6),
        ("Computer Networks", "present", 7),
        ("Computer Networks", "present", 8),
        ("Computer Networks", "absent", 9),
        ("Computer Networks", "absent", 10),
    ]
    for subj, stat, day in stu2_statuses:
        dt = (base_date + timedelta(days=day)).strftime("%Y-%m-%d %H:%M:%S")
        records.append({
            "student_id": "STU002",
            "name": "Bob Jones",
            "division": "CSE-A",
            "subject": subj,
            "session_date": dt,
            "status": stat
        })
        
    # STU003: 9/10 present (90.0%)
    for day in range(1, 11):
        stat = "absent" if day == 1 else "present"
        dt = (base_date + timedelta(days=day)).strftime("%Y-%m-%d %H:%M:%S")
        records.append({
            "student_id": "STU003",
            "name": "Charlie Brown",
            "division": "CSE-B",
            "subject": "Operating Systems",
            "session_date": dt,
            "status": stat
        })
        
    return pd.DataFrame(records)


def test_overall_attendance(sample_attendance_df):
    """Test overall attendance calculation for known student."""
    res1 = overall_attendance(sample_attendance_df, "STU001")
    assert res1 is not None
    assert res1["student_id"] == "STU001"
    assert res1["name"] == "Alice Smith"
    assert res1["division"] == "CSE-A"
    assert res1["total_classes"] == 10
    assert res1["attended_classes"] == 8
    assert res1["attendance_pct"] == 80.0
    assert isinstance(res1["attendance_pct"], float)
    assert isinstance(res1["total_classes"], int)

    res2 = overall_attendance(sample_attendance_df, "STU002")
    assert res2["attended_classes"] == 5
    assert res2["attendance_pct"] == 50.0

    # Non-existent student
    res_none = overall_attendance(sample_attendance_df, "NONEXISTENT")
    assert res_none is None


def test_subject_wise_attendance(sample_attendance_df):
    """Test subject breakdown calculations."""
    res = subject_wise_attendance(sample_attendance_df, "STU001")
    assert len(res) == 2
    
    cn = next(r for r in res if r["subject"] == "Computer Networks")
    os = next(r for r in res if r["subject"] == "Operating Systems")
    
    assert cn["total_classes"] == 5
    assert cn["attended_classes"] == 4
    assert cn["attendance_pct"] == 80.0
    
    assert os["total_classes"] == 5
    assert os["attended_classes"] == 4
    assert os["attendance_pct"] == 80.0


def test_classes_can_miss(sample_attendance_df):
    """Test margin of safety and catch-up classes required."""
    # STU003 has 9/10 (90%) in OS. Threshold 75%.
    # 9 / 0.75 - 10 = 12 - 10 = 2 classes can be missed!
    res3 = classes_can_miss(sample_attendance_df, "STU003", threshold=75.0)
    assert len(res3) == 1
    assert res3[0]["subject"] == "Operating Systems"
    assert res3[0]["attendance_pct"] == 90.0
    assert res3[0]["status"] == "safe"
    assert res3[0]["classes_can_miss"] == 2
    assert res3[0]["classes_to_attend"] == 0

    # STU002 has 2/5 (40%) in OS. Threshold 75%.
    # Required catch-up: ceil((0.75 * 5 - 2) / (1 - 0.75)) = ceil(1.75 / 0.25) = ceil(7.0) = 7.
    # Check: (2 + 7) / (5 + 7) = 9 / 12 = 75.0%
    res2 = classes_can_miss(sample_attendance_df, "STU002", threshold=75.0)
    os_item = next(r for r in res2 if r["subject"] == "Operating Systems")
    assert os_item["status"] == "at_risk"
    assert os_item["classes_can_miss"] == 0
    assert os_item["classes_to_attend"] == 7


def test_attendance_trend(sample_attendance_df):
    """Test attendance trend calculation."""
    trend1 = attendance_trend(sample_attendance_df, "STU001", window_days=5)
    assert "delta" in trend1
    assert "trend" in trend1
    assert trend1["trend"] in ["improving", "declining", "stable"]
    assert isinstance(trend1["delta"], float)


def test_consecutive_absences(sample_attendance_df):
    """Test consecutive absence streak counting from most recent session."""
    # STU002 ended with day 9 absent, day 10 absent -> streak is 2
    streak2 = consecutive_absences(sample_attendance_df, "STU002")
    assert streak2 == 2

    # STU001 ended with day 10 present -> streak is 0
    streak1 = consecutive_absences(sample_attendance_df, "STU001")
    assert streak1 == 0


def test_recent_absence_count(sample_attendance_df):
    """Test counting absences in last N classes."""
    # STU001 has 2 absences in 10 classes
    rec1 = recent_absence_count(sample_attendance_df, "STU001", last_n_classes=10)
    assert rec1 == 2

    # STU002 has 5 absences in 10 classes
    rec2 = recent_absence_count(sample_attendance_df, "STU002", last_n_classes=10)
    assert rec2 == 5

    # STU002 in last 3 classes (days 8 present, 9 absent, 10 absent) has 2 absences
    rec2_last3 = recent_absence_count(sample_attendance_df, "STU002", last_n_classes=3)
    assert rec2_last3 == 2


def test_class_attendance_summary(sample_attendance_df):
    """Test division-level aggregation and defaulters identification."""
    summary_a = class_attendance_summary(sample_attendance_df, division="CSE-A", threshold=75.0)
    assert summary_a["division"] == "CSE-A"
    assert summary_a["total_students"] == 2
    # STU001=80.0%, STU002=50.0% -> average is 65.0%
    assert summary_a["average_attendance_pct"] == 65.0
    assert summary_a["students_below_threshold_count"] == 1
    assert summary_a["students_below_threshold"][0]["student_id"] == "STU002"
    assert summary_a["students_below_threshold"][0]["attendance_pct"] == 50.0
