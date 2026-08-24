"""API endpoint integration tests using FastAPI TestClient."""

import pytest
from fastapi.testclient import TestClient

from src.api import app


@pytest.fixture
def client():
    """Create a FastAPI TestClient."""
    return TestClient(app)


def test_root_endpoint(client):
    """Test root overview route."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "AntiProxy Analytics & Risk Intelligence Service"
    assert "endpoints" in data


def test_health_endpoint(client):
    """Test health check route."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data
    assert "data_source" in data


def test_student_analytics_endpoint(client):
    """Test student analytics route."""
    # STU001 is guaranteed to exist in generated fake data
    response = client.get("/analytics/student/STU001")
    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == "STU001"
    assert "overall" in data
    assert "subject_wise" in data
    assert "classes_can_miss" in data
    assert "trend" in data
    assert "consecutive_absences" in data
    assert "recent_absences_last_10" in data
    assert isinstance(data["overall"]["attendance_pct"], (int, float))


def test_student_analytics_404(client):
    """Test student analytics 404 for non-existent student."""
    response = client.get("/analytics/student/INVALID_ID_9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_student_risk_endpoint(client):
    """Test rule-based student risk assessment endpoint."""
    response = client.get("/risk/student/STU001")
    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == "STU001"
    assert "risk_score" in data
    assert "risk_level" in data
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert "breakdown" in data
    assert "attendance_gap" in data["breakdown"]


def test_student_ml_risk_endpoint(client):
    """Test ML risk prediction and anomaly detection endpoint."""
    response = client.get("/risk/student/STU001/ml")
    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == "STU001"
    assert "rule_based_risk" in data
    assert "ml_risk" in data
    assert "comparison" in data
    assert "is_anomaly" in data["comparison"]
    assert "defaulter_probability" in data["comparison"]


def test_class_analytics_endpoint(client):
    """Test division/class analytics endpoint."""
    response = client.get("/analytics/class/CSE-A")
    assert response.status_code == 200
    data = response.json()
    assert data["division"] == "CSE-A"
    assert data["total_students"] > 0
    assert "average_attendance_pct" in data
    assert "students_below_threshold" in data


def test_class_analytics_404(client):
    """Test class analytics 404 for non-existent division."""
    response = client.get("/analytics/class/NON_EXISTENT_DIV")
    assert response.status_code == 404


def test_class_risk_endpoint(client):
    """Test class risk ranking endpoint."""
    response = client.get("/risk/class/CSE-A")
    assert response.status_code == 200
    data = response.json()
    assert data["division"] == "CSE-A"
    assert data["total_students"] > 0
    assert "students" in data
    assert len(data["students"]) == data["total_students"]
    
    # Check descending order of risk score
    scores = [s["risk_score"] for s in data["students"]]
    assert scores == sorted(scores, reverse=True)
