"""Unit tests for src/risk_engine.py verifying weights, boundaries, and class risk ranking."""

import pytest
import pandas as pd
from datetime import datetime, timedelta

from src.risk_engine import (
    calculate_risk,
    calculate_risk_for_class,
    WEIGHT_GAP,
    WEIGHT_TREND,
    WEIGHT_CONSECUTIVE,
    WEIGHT_RECENT,
)


@pytest.fixture
def risk_test_df():
    """Deterministic DataFrame with students spanning LOW, MEDIUM, and HIGH risk."""
    base_date = datetime(2026, 1, 1, 10, 0, 0)
    records = []
    
    # Perfect student (LOW risk) - 100% attendance, no absences
    for day in range(1, 11):
        records.append({
            "student_id": "LOW_STU",
            "name": "Low Risk Student",
            "division": "CSE-A",
            "subject": "Operating Systems",
            "session_date": (base_date + timedelta(days=day)).strftime("%Y-%m-%d %H:%M:%S"),
            "status": "present"
        })
        
    # Chronic absentee / High risk student (HIGH risk) - 10% attendance, recent streak of 5 absences
    for day in range(1, 11):
        stat = "present" if day == 1 else "absent"
        records.append({
            "student_id": "HIGH_STU",
            "name": "High Risk Student",
            "division": "CSE-A",
            "subject": "Operating Systems",
            "session_date": (base_date + timedelta(days=day)).strftime("%Y-%m-%d %H:%M:%S"),
            "status": stat
        })
        
    # Borderline student (MEDIUM risk) - 70% attendance (just under 75%)
    for day in range(1, 11):
        stat = "absent" if day in [9, 10, 5] else "present"
        records.append({
            "student_id": "MED_STU",
            "name": "Medium Risk Student",
            "division": "CSE-A",
            "subject": "Operating Systems",
            "session_date": (base_date + timedelta(days=day)).strftime("%Y-%m-%d %H:%M:%S"),
            "status": stat
        })
        
    return pd.DataFrame(records)


def test_weights_sum_to_one():
    """Verify that the risk engine weights strictly sum to 1.0."""
    total_weights = WEIGHT_GAP + WEIGHT_TREND + WEIGHT_CONSECUTIVE + WEIGHT_RECENT
    assert pytest.approx(total_weights, 0.001) == 1.0


def test_low_risk_student(risk_test_df):
    """Test student with 100% attendance evaluates to LOW risk."""
    res = calculate_risk(risk_test_df, "LOW_STU")
    assert res is not None
    assert res["risk_level"] == "LOW"
    assert res["risk_score"] == 0.0
    assert res["breakdown"]["attendance_gap"]["contribution"] == 0.0
    assert res["breakdown"]["consecutive_absences"]["contribution"] == 0.0


def test_high_risk_student(risk_test_df):
    """Test chronic absentee evaluates to HIGH risk."""
    res = calculate_risk(risk_test_df, "HIGH_STU")
    assert res is not None
    assert res["risk_level"] == "HIGH"
    assert res["risk_score"] >= 60.0


def test_risk_breakdown_structure(risk_test_df):
    """Verify breakdown components match expected keys, weights, and contribute to total."""
    res = calculate_risk(risk_test_df, "MED_STU")
    assert res is not None
    breakdown = res["breakdown"]
    
    assert "attendance_gap" in breakdown
    assert "trend" in breakdown
    assert "consecutive_absences" in breakdown
    assert "recent_absences" in breakdown
    
    assert breakdown["attendance_gap"]["weight"] == 0.40
    assert breakdown["trend"]["weight"] == 0.25
    assert breakdown["consecutive_absences"]["weight"] == 0.20
    assert breakdown["recent_absences"]["weight"] == 0.15
    
    # Sum of contributions should equal or approximately equal total risk score
    contrib_sum = sum(b["contribution"] for b in breakdown.values())
    assert pytest.approx(res["risk_score"], 0.1) == contrib_sum


def test_calculate_risk_for_class_sorted(risk_test_df):
    """Verify class risk calculation returns students ordered from highest risk to lowest."""
    class_results = calculate_risk_for_class(risk_test_df, division="CSE-A")
    assert len(class_results) == 3
    
    scores = [r["risk_score"] for r in class_results]
    assert scores == sorted(scores, reverse=True)
    assert class_results[0]["student_id"] == "HIGH_STU"
    assert class_results[-1]["student_id"] == "LOW_STU"
