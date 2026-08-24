"""FastAPI REST API for AntiProxy Analytics & Risk Intelligence Module.

Endpoints:
- GET /health
- GET /analytics/student/{student_id}
- GET /risk/student/{student_id}
- GET /risk/student/{student_id}/ml
- GET /analytics/class/{division}
- GET /risk/class/{division}
"""

import os
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

from src.db import get_attendance_data
from src.analytics import (
    overall_attendance,
    subject_wise_attendance,
    classes_can_miss,
    attendance_trend,
    consecutive_absences,
    recent_absence_count,
    class_attendance_summary,
)
from src.risk_engine import (
    calculate_risk,
    calculate_risk_for_class,
)
from src.ml_model import (
    predict_ml_risk,
    detect_anomaly,
)

app = FastAPI(
    title="AntiProxy Analytics & Risk Intelligence Service",
    description="Standalone microservice for attendance analytics, explainable risk scoring, and ML anomaly detection.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_df():
    """Helper to fetch dataframe from active data source."""
    return get_attendance_data()


@app.get("/", summary="Service Overview")
def root_overview() -> Dict[str, Any]:
    """Root overview providing service info and links to available endpoints."""
    return {
        "service": "AntiProxy Analytics & Risk Intelligence Service",
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "health": "/health",
            "student_analytics": "/analytics/student/{student_id}",
            "student_risk_rule_based": "/risk/student/{student_id}",
            "student_risk_ml": "/risk/student/{student_id}/ml",
            "class_analytics": "/analytics/class/{division}",
            "class_risk": "/risk/class/{division}"
        },
        "sample_links": [
            "/docs",
            "/health",
            "/analytics/student/STU001",
            "/risk/student/STU001",
            "/risk/student/STU001/ml",
            "/analytics/class/CSE-A",
            "/risk/class/CSE-A"
        ]
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    """Silence browser favicon requests."""
    return Response(status_code=204)


@app.get("/health", summary="Health Check")
def health_check() -> Dict[str, str]:
    """Simple health check endpoint."""
    data_source = os.getenv("DATA_SOURCE", "fake").lower()
    return {
        "status": "ok",
        "service": "antiproxy-analytics",
        "data_source": data_source
    }


@app.get("/analytics/student/{student_id}", summary="Student Attendance Analytics")
def get_student_analytics(
    student_id: str,
    threshold: float = Query(75.0, description="Attendance threshold percentage", ge=0.0, le=100.0),
    window_days: int = Query(30, description="Window size for trend calculation in days", ge=1)
) -> Dict[str, Any]:
    """Retrieve comprehensive attendance analytics for a single student."""
    df = get_df()
    overall = overall_attendance(df, student_id)
    if overall is None:
        raise HTTPException(
            status_code=404,
            detail=f"Student with ID '{student_id}' not found."
        )
    
    subject_wise = subject_wise_attendance(df, student_id)
    can_miss = classes_can_miss(df, student_id, threshold=threshold)
    trend = attendance_trend(df, student_id, window_days=window_days)
    consec = consecutive_absences(df, student_id)
    recent_abs = recent_absence_count(df, student_id, last_n_classes=10)
    
    return {
        "student_id": str(student_id),
        "overall": overall,
        "subject_wise": subject_wise,
        "classes_can_miss": can_miss,
        "trend": trend,
        "consecutive_absences": consec,
        "recent_absences_last_10": recent_abs
    }


@app.get("/risk/student/{student_id}", summary="Rule-Based Defaulter Risk Assessment")
def get_student_risk(
    student_id: str,
    threshold: float = Query(75.0, description="Attendance threshold percentage", ge=0.0, le=100.0)
) -> Dict[str, Any]:
    """Retrieve explainable rule-based defaulter risk score and component breakdown for a student."""
    df = get_df()
    risk_result = calculate_risk(df, student_id, threshold=threshold)
    if risk_result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Student with ID '{student_id}' not found."
        )
    return risk_result


@app.get("/risk/student/{student_id}/ml", summary="Comparative ML Risk Assessment & Anomaly Detection")
def get_student_ml_risk(
    student_id: str,
    threshold: float = Query(75.0, description="Attendance threshold percentage", ge=0.0, le=100.0)
) -> Dict[str, Any]:
    """Retrieve ML-based risk predictions & anomaly flags side-by-side with transparent rule-based risk."""
    df = get_df()
    rule_risk = calculate_risk(df, student_id, threshold=threshold)
    if rule_risk is None:
        raise HTTPException(
            status_code=404,
            detail=f"Student with ID '{student_id}' not found."
        )
        
    ml_risk = predict_ml_risk(df, student_id, threshold=threshold)
    
    return {
        "student_id": str(student_id),
        "name": rule_risk["name"],
        "division": rule_risk["division"],
        "rule_based_risk": rule_risk,
        "ml_risk": ml_risk,
        "comparison": {
            "rule_score": rule_risk["risk_score"],
            "rule_level": rule_risk["risk_level"],
            "ml_score": ml_risk["ml_risk_score"] if ml_risk else None,
            "ml_level": ml_risk["ml_predicted_level"] if ml_risk else None,
            "defaulter_probability": ml_risk["defaulter_probability"] if ml_risk else None,
            "is_anomaly": ml_risk["is_anomaly"] if ml_risk else False
        }
    }


@app.get("/analytics/class/{division}", summary="Class / Division Attendance Analytics")
def get_class_analytics(
    division: str,
    subject: Optional[str] = Query(None, description="Optional subject filter"),
    threshold: float = Query(75.0, description="Attendance threshold percentage", ge=0.0, le=100.0)
) -> Dict[str, Any]:
    """Retrieve aggregate attendance summary for a division/class."""
    df = get_df()
    summary = class_attendance_summary(df, division=division, subject=subject, threshold=threshold)
    if summary["total_students"] == 0:
        raise HTTPException(
            status_code=404,
            detail=f"Division '{division}' not found or contains no records."
        )
    return summary


@app.get("/risk/class/{division}", summary="Class Defaulter Risk Ranking")
def get_class_risk(
    division: str,
    threshold: float = Query(75.0, description="Attendance threshold percentage", ge=0.0, le=100.0)
) -> Dict[str, Any]:
    """Retrieve ranked risk assessments for all students in a division (sorted highest risk first)."""
    df = get_df()
    risk_list = calculate_risk_for_class(df, division=division, threshold=threshold)
    if not risk_list:
        raise HTTPException(
            status_code=404,
            detail=f"Division '{division}' not found or contains no records."
        )
        
    high_count = sum(1 for r in risk_list if r["risk_level"] == "HIGH")
    med_count = sum(1 for r in risk_list if r["risk_level"] == "MEDIUM")
    low_count = sum(1 for r in risk_list if r["risk_level"] == "LOW")
    
    return {
        "division": str(division),
        "total_students": len(risk_list),
        "high_risk_count": high_count,
        "medium_risk_count": med_count,
        "low_risk_count": low_count,
        "students": risk_list
    }
