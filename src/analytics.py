"""Pure analytics functions for AntiProxy.

Every function consumes a flat pandas DataFrame with columns:
student_id, name, division, subject, session_date, status

All functions return plain, JSON-serializable Python data structures (dict/list).
All NumPy primitives are explicitly cast to native Python types (int, float, str, bool).
"""

import math
from datetime import timedelta
from typing import Any, Dict, List, Optional
import pandas as pd


def overall_attendance(df: pd.DataFrame, student_id: str) -> Optional[Dict[str, Any]]:
    """Calculate overall attendance metrics for a specific student."""
    student_df = df[df["student_id"] == student_id]
    if student_df.empty:
        return None
    
    total_classes = int(len(student_df))
    attended_classes = int((student_df["status"] == "present").sum())
    attendance_pct = round(float((attended_classes / total_classes) * 100.0), 2) if total_classes > 0 else 0.0
    
    return {
        "student_id": str(student_id),
        "name": str(student_df["name"].iloc[0]),
        "division": str(student_df["division"].iloc[0]),
        "total_classes": total_classes,
        "attended_classes": attended_classes,
        "attendance_pct": attendance_pct
    }


def subject_wise_attendance(df: pd.DataFrame, student_id: str) -> List[Dict[str, Any]]:
    """Calculate attendance metrics broken down by subject for a student."""
    student_df = df[df["student_id"] == student_id]
    if student_df.empty:
        return []
    
    results = []
    for subject, sub_df in student_df.groupby("subject", sort=True):
        total_classes = int(len(sub_df))
        attended_classes = int((sub_df["status"] == "present").sum())
        attendance_pct = round(float((attended_classes / total_classes) * 100.0), 2) if total_classes > 0 else 0.0
        
        results.append({
            "subject": str(subject),
            "total_classes": total_classes,
            "attended_classes": attended_classes,
            "attendance_pct": attendance_pct
        })
    
    return results


def classes_can_miss(df: pd.DataFrame, student_id: str, threshold: float = 75.0) -> List[Dict[str, Any]]:
    """Calculate margin of safety or required catch-up classes for each subject.
    
    - If attendance_pct >= threshold: calculate how many consecutive future classes
      can be missed while remaining >= threshold.
      Condition: attended / (total + M) >= p => M <= attended / p - total.
    - If attendance_pct < threshold: calculate how many consecutive future classes
      must be attended to reach >= threshold.
      Condition: (attended + C) / (total + C) >= p => C >= (p * total - attended) / (1 - p).
    """
    student_df = df[df["student_id"] == student_id]
    if student_df.empty:
        return []
    
    p = threshold / 100.0
    results = []
    
    for subject, sub_df in student_df.groupby("subject", sort=True):
        total = int(len(sub_df))
        attended = int((sub_df["status"] == "present").sum())
        pct = round(float((attended / total) * 100.0), 2) if total > 0 else 0.0
        
        if total == 0:
            classes_miss = 0
            classes_attend = 0
            status = "safe"
        elif pct >= threshold:
            if p > 0:
                max_missable = math.floor(attended / p - total)
                classes_miss = int(max(0, max_missable))
            else:
                classes_miss = 999
            classes_attend = 0
            status = "safe"
        else:
            if p < 1.0:
                min_attend = math.ceil((p * total - attended) / (1.0 - p))
                classes_attend = int(max(0, min_attend))
            else:
                classes_attend = 999
            classes_miss = 0
            status = "at_risk"
            
        results.append({
            "subject": str(subject),
            "attendance_pct": pct,
            "threshold": float(threshold),
            "status": status,
            "classes_can_miss": classes_miss,
            "classes_to_attend": classes_attend
        })
        
    return results


def attendance_trend(df: pd.DataFrame, student_id: str, window_days: int = 30) -> Dict[str, Any]:
    """Compare attendance percentage in the most recent window vs the prior window."""
    student_df = df[df["student_id"] == student_id].copy()
    if student_df.empty:
        return {
            "student_id": str(student_id),
            "recent_pct": 0.0,
            "prior_pct": 0.0,
            "delta": 0.0,
            "trend": "stable",
            "window_days": int(window_days)
        }
    
    student_df["dt"] = pd.to_datetime(student_df["session_date"])
    max_dt = student_df["dt"].max()
    
    recent_cutoff = max_dt - timedelta(days=window_days)
    prior_cutoff = max_dt - timedelta(days=2 * window_days)
    
    recent_records = student_df[(student_df["dt"] > recent_cutoff) & (student_df["dt"] <= max_dt)]
    prior_records = student_df[(student_df["dt"] > prior_cutoff) & (student_df["dt"] <= recent_cutoff)]
    
    # If prior window has no records because dataset is smaller than 2*window_days,
    # fall back to splitting records chronologically in half
    if prior_records.empty and len(student_df) >= 2:
        sorted_df = student_df.sort_values(by="dt").reset_index(drop=True)
        half = len(sorted_df) // 2
        prior_records = sorted_df.iloc[:half]
        recent_records = sorted_df.iloc[half:]
    
    recent_total = len(recent_records)
    recent_attended = (recent_records["status"] == "present").sum() if recent_total > 0 else 0
    recent_pct = float(round((recent_attended / recent_total) * 100.0, 2)) if recent_total > 0 else 0.0
    
    prior_total = len(prior_records)
    prior_attended = (prior_records["status"] == "present").sum() if prior_total > 0 else 0
    prior_pct = float(round((prior_attended / prior_total) * 100.0, 2)) if prior_total > 0 else 0.0
    
    delta = float(round(recent_pct - prior_pct, 2))
    
    if delta > 2.0:
        trend = "improving"
    elif delta < -2.0:
        trend = "declining"
    else:
        trend = "stable"
        
    return {
        "student_id": str(student_id),
        "recent_pct": recent_pct,
        "prior_pct": prior_pct,
        "delta": delta,
        "trend": trend,
        "window_days": int(window_days)
    }


def consecutive_absences(df: pd.DataFrame, student_id: str) -> int:
    """Calculate the student's current streak of consecutive absences."""
    student_df = df[df["student_id"] == student_id].copy()
    if student_df.empty:
        return 0
    
    student_df["dt"] = pd.to_datetime(student_df["session_date"])
    sorted_records = student_df.sort_values(by="dt", ascending=False)
    
    streak = 0
    for _, row in sorted_records.iterrows():
        if row["status"] == "absent":
            streak += 1
        else:
            break
            
    return int(streak)


def recent_absence_count(df: pd.DataFrame, student_id: str, last_n_classes: int = 10) -> int:
    """Count absences in the student's last N conducted classes."""
    student_df = df[df["student_id"] == student_id].copy()
    if student_df.empty:
        return 0
    
    student_df["dt"] = pd.to_datetime(student_df["session_date"])
    sorted_records = student_df.sort_values(by="dt", ascending=False).head(last_n_classes)
    
    count = int((sorted_records["status"] == "absent").sum())
    return count


def class_attendance_summary(
    df: pd.DataFrame,
    division: Optional[str] = None,
    subject: Optional[str] = None,
    threshold: float = 75.0
) -> Dict[str, Any]:
    """Calculate class/division level summary and list students below threshold."""
    filtered_df = df.copy()
    if division is not None:
        filtered_df = filtered_df[filtered_df["division"] == division]
    if subject is not None:
        filtered_df = filtered_df[filtered_df["subject"] == subject]
        
    if filtered_df.empty:
        return {
            "division": str(division) if division else None,
            "subject": str(subject) if subject else None,
            "threshold": float(threshold),
            "total_students": 0,
            "average_attendance_pct": 0.0,
            "students_below_threshold_count": 0,
            "students_below_threshold": []
        }
    
    student_metrics = []
    for sid, s_group in filtered_df.groupby("student_id"):
        tot = len(s_group)
        att = (s_group["status"] == "present").sum()
        pct = round(float((att / tot) * 100.0), 2) if tot > 0 else 0.0
        name = str(s_group["name"].iloc[0])
        div = str(s_group["division"].iloc[0])
        student_metrics.append({
            "student_id": str(sid),
            "name": name,
            "division": div,
            "attendance_pct": pct
        })
        
    total_students = int(len(student_metrics))
    avg_pct = round(float(sum(s["attendance_pct"] for s in student_metrics) / total_students), 2) if total_students > 0 else 0.0
    below_thresh = [s for s in student_metrics if s["attendance_pct"] < threshold]
    below_thresh.sort(key=lambda x: x["attendance_pct"])
    
    return {
        "division": str(division) if division else None,
        "subject": str(subject) if subject else None,
        "threshold": float(threshold),
        "total_students": total_students,
        "average_attendance_pct": avg_pct,
        "students_below_threshold_count": int(len(below_thresh)),
        "students_below_threshold": below_thresh
    }
