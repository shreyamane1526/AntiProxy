"""Transparent, rule-based defaulter risk engine for AntiProxy.

Combines four weighted risk components into a 0–100 risk score and level:
1. Attendance gap below threshold (weight 0.40)
2. Trend in attendance (weight 0.25)
3. Current streak of consecutive absences (weight 0.20)
4. Recent absences in the last 10 classes (weight 0.15)

Risk Levels:
- LOW: risk_score < 30
- MEDIUM: 30 <= risk_score < 60
- HIGH: risk_score >= 60

Every output is a plain JSON-serializable Python dictionary/list.
"""

from typing import Any, Dict, List, Optional
import pandas as pd

from src.analytics import (
    overall_attendance,
    attendance_trend,
    consecutive_absences,
    recent_absence_count,
)

WEIGHT_GAP = 0.40
WEIGHT_TREND = 0.25
WEIGHT_CONSECUTIVE = 0.20
WEIGHT_RECENT = 0.15

THRESHOLD_DEFAULT = 75.0


def calculate_risk(
    df: pd.DataFrame,
    student_id: str,
    threshold: float = THRESHOLD_DEFAULT
) -> Optional[Dict[str, Any]]:
    """Calculate transparent, explainable rule-based risk score for a single student."""
    overall = overall_attendance(df, student_id)
    if overall is None:
        return None
    
    att_pct = overall["attendance_pct"]
    name = overall["name"]
    division = overall["division"]
    
    # 1. Attendance Gap (0 - 100)
    if att_pct >= threshold:
        gap_score = 0.0
    else:
        gap = threshold - att_pct
        gap_score = min(100.0, max(0.0, (gap / threshold) * 100.0))
        
    # 2. Trend (0 - 100)
    trend_info = attendance_trend(df, student_id)
    delta = trend_info["delta"]
    if delta >= 0:
        trend_score = 0.0
    else:
        # A 25% drop or more maps to full 100 risk score
        trend_score = min(100.0, max(0.0, -delta * 4.0))
        
    # 3. Consecutive Absences (0 - 100)
    streak = consecutive_absences(df, student_id)
    # 5+ consecutive absences maps to full 100 risk score
    consecutive_score = min(100.0, float(streak * 20.0))
    
    # 4. Recent Absences in last 10 classes (0 - 100)
    rec_abs = recent_absence_count(df, student_id, last_n_classes=10)
    recent_score = min(100.0, float((rec_abs / 10.0) * 100.0))
    
    # Weighted sum
    raw_risk = (
        WEIGHT_GAP * gap_score +
        WEIGHT_TREND * trend_score +
        WEIGHT_CONSECUTIVE * consecutive_score +
        WEIGHT_RECENT * recent_score
    )
    risk_score = round(float(min(100.0, max(0.0, raw_risk))), 2)
    
    if risk_score < 30.0:
        risk_level = "LOW"
    elif risk_score < 60.0:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"
        
    breakdown = {
        "attendance_gap": {
            "score": round(float(gap_score), 2),
            "weight": WEIGHT_GAP,
            "contribution": round(float(WEIGHT_GAP * gap_score), 2),
            "attendance_pct": float(att_pct),
            "threshold": float(threshold)
        },
        "trend": {
            "score": round(float(trend_score), 2),
            "weight": WEIGHT_TREND,
            "contribution": round(float(WEIGHT_TREND * trend_score), 2),
            "delta": float(delta),
            "trend_direction": str(trend_info["trend"])
        },
        "consecutive_absences": {
            "score": round(float(consecutive_score), 2),
            "weight": WEIGHT_CONSECUTIVE,
            "contribution": round(float(WEIGHT_CONSECUTIVE * consecutive_score), 2),
            "streak": int(streak)
        },
        "recent_absences": {
            "score": round(float(recent_score), 2),
            "weight": WEIGHT_RECENT,
            "contribution": round(float(WEIGHT_RECENT * recent_score), 2),
            "absent_count": int(rec_abs),
            "evaluated_classes": 10
        }
    }
    
    return {
        "student_id": str(student_id),
        "name": str(name),
        "division": str(division),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "attendance_pct": float(att_pct),
        "breakdown": breakdown
    }


def calculate_risk_for_class(
    df: pd.DataFrame,
    division: Optional[str] = None,
    threshold: float = THRESHOLD_DEFAULT
) -> List[Dict[str, Any]]:
    """Calculate risk scores for all students in a division (or entire dataset), sorted highest-risk first."""
    filtered_df = df if division is None else df[df["division"] == division]
    if filtered_df.empty:
        return []
    
    student_ids = filtered_df["student_id"].unique()
    results = []
    
    for sid in student_ids:
        risk_data = calculate_risk(df, sid, threshold=threshold)
        if risk_data is not None:
            results.append(risk_data)
            
    # Sort highest risk score first
    results.sort(key=lambda x: x["risk_score"], reverse=True)
    return results
