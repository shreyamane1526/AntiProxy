"""Machine Learning risk prediction and anomaly detection for AntiProxy.

Contains two models trained on attendance features:
1. RandomForestClassifier - Defaulter risk prediction using features:
   [attendance_pct, trend_delta, consecutive_absences, recent_absence_count, subjects_below_threshold]
   Labeled using rule-based risk baseline (bootstrapping placeholder).
2. IsolationForest - Unsupervised anomaly detection flagging abnormal attendance behaviors.

These models run alongside the transparent rule-based engine to provide comparative insights.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest

from src.analytics import (
    overall_attendance,
    attendance_trend,
    consecutive_absences,
    recent_absence_count,
    classes_can_miss,
)
from src.risk_engine import calculate_risk


# Global cache for trained models to avoid retraining on every request
_MODEL_CACHE: Dict[str, Any] = {
    "rf_classifier": None,
    "isolation_forest": None,
    "feature_names": [
        "attendance_pct",
        "trend_delta",
        "consecutive_absences",
        "recent_absence_count",
        "subjects_below_threshold"
    ],
    "trained_fingerprint": None
}


def extract_features_for_student(df: pd.DataFrame, student_id: str, threshold: float = 75.0) -> Optional[List[float]]:
    """Extract a 5-dimensional feature vector for a student."""
    overall = overall_attendance(df, student_id)
    if overall is None:
        return None
    
    trend = attendance_trend(df, student_id)
    consec = consecutive_absences(df, student_id)
    rec_abs = recent_absence_count(df, student_id, last_n_classes=10)
    sub_miss = classes_can_miss(df, student_id, threshold=threshold)
    subs_below = sum(1 for s in sub_miss if s["status"] == "at_risk")
    
    return [
        float(overall["attendance_pct"]),
        float(trend["delta"]),
        float(consec),
        float(rec_abs),
        float(subs_below)
    ]


def build_training_dataset(df: pd.DataFrame, threshold: float = 75.0) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[str]]:
    """Build feature matrix X and labels y for all students in the dataframe."""
    student_ids = list(df["student_id"].unique())
    X_list = []
    y_class_list = []
    y_risk_score_list = []
    valid_students = []
    
    for sid in student_ids:
        feats = extract_features_for_student(df, sid, threshold=threshold)
        risk_res = calculate_risk(df, sid, threshold=threshold)
        if feats is not None and risk_res is not None:
            X_list.append(feats)
            y_class_list.append(risk_res["risk_level"])
            y_risk_score_list.append(risk_res["risk_score"])
            valid_students.append(sid)
            
    X = np.array(X_list, dtype=np.float64) if X_list else np.empty((0, 5))
    y_class = np.array(y_class_list)
    y_score = np.array(y_risk_score_list, dtype=np.float64)
    return X, y_class, y_score, valid_students


def get_or_train_models(df: pd.DataFrame, force_retrain: bool = False) -> Tuple[RandomForestClassifier, IsolationForest]:
    """Retrieve cached models or train new models on the supplied dataset."""
    fingerprint = f"{len(df)}_{df['student_id'].nunique()}"
    
    if (
        not force_retrain
        and _MODEL_CACHE["rf_classifier"] is not None
        and _MODEL_CACHE["isolation_forest"] is not None
        and _MODEL_CACHE["trained_fingerprint"] == fingerprint
    ):
        return _MODEL_CACHE["rf_classifier"], _MODEL_CACHE["isolation_forest"]
    
    X, y_class, _, _ = build_training_dataset(df)
    
    # RandomForestClassifier for Defaulter Risk
    rf = RandomForestClassifier(
        n_estimators=50,
        max_depth=4,
        random_state=42,
        class_weight="balanced"
    )
    if len(X) > 0 and len(np.unique(y_class)) > 1:
        rf.fit(X, y_class)
    elif len(X) > 0:
        # Fallback if only 1 class present in tiny fixture
        rf.fit(X, y_class)
    
    # IsolationForest for Anomaly Detection
    iso = IsolationForest(
        n_estimators=50,
        contamination=0.1,
        random_state=42
    )
    if len(X) >= 2:
        iso.fit(X)
    
    _MODEL_CACHE["rf_classifier"] = rf
    _MODEL_CACHE["isolation_forest"] = iso
    _MODEL_CACHE["trained_fingerprint"] = fingerprint
    
    return rf, iso


def predict_ml_risk(df: pd.DataFrame, student_id: str, threshold: float = 75.0) -> Optional[Dict[str, Any]]:
    """Predict risk level, defaulter probability, and anomaly score using ML models."""
    feats = extract_features_for_student(df, student_id, threshold=threshold)
    if feats is None:
        return None
    
    rf, iso = get_or_train_models(df)
    X_single = np.array([feats], dtype=np.float64)
    
    # Defaulter risk prediction
    if hasattr(rf, "classes_") and len(rf.classes_) > 0:
        predicted_level = str(rf.predict(X_single)[0])
        proba_array = rf.predict_proba(X_single)[0]
        class_probas = {str(cls): float(round(p, 4)) for cls, p in zip(rf.classes_, proba_array)}
        
        # Risk score mapping from probabilities (HIGH=100, MEDIUM=50, LOW=0)
        p_high = class_probas.get("HIGH", 0.0)
        p_med = class_probas.get("MEDIUM", 0.0)
        p_low = class_probas.get("LOW", 0.0)
        
        defaulter_probability = float(round(p_high + p_med, 4))
        ml_risk_score = float(round(p_high * 100.0 + p_med * 50.0 + p_low * 0.0, 2))
        confidence = float(round(max(proba_array), 4))
    else:
        predicted_level = "UNKNOWN"
        class_probas = {}
        defaulter_probability = 0.0
        ml_risk_score = 0.0
        confidence = 0.0
        
    # Anomaly detection
    if hasattr(iso, "estimators_") and len(iso.estimators_) > 0:
        iso_pred = int(iso.predict(X_single)[0])  # -1 for anomaly, 1 for normal
        is_anomaly = bool(iso_pred == -1)
        # Decision function: lower values mean more anomalous
        raw_score = float(iso.decision_function(X_single)[0])
        anomaly_score = float(round(raw_score, 4))
    else:
        is_anomaly = False
        anomaly_score = 0.0
        
    return {
        "student_id": str(student_id),
        "ml_risk_score": ml_risk_score,
        "ml_predicted_level": predicted_level,
        "defaulter_probability": defaulter_probability,
        "class_probabilities": class_probas,
        "confidence": confidence,
        "is_anomaly": is_anomaly,
        "anomaly_score": anomaly_score,
        "feature_values": {
            "attendance_pct": round(feats[0], 2),
            "trend_delta": round(feats[1], 2),
            "consecutive_absences": int(feats[2]),
            "recent_absence_count": int(feats[3]),
            "subjects_below_threshold": int(feats[4])
        },
        "model_type": "RandomForestClassifier + IsolationForest",
        "bootstrap_notice": "Trained on synthetic bootstrap data labeled via rule-based risk baseline. Placeholder until empirical attendance history is collected."
    }


def detect_anomaly(df: pd.DataFrame, student_id: str, threshold: float = 75.0) -> Optional[Dict[str, Any]]:
    """Detect if a student's attendance pattern is anomalous."""
    res = predict_ml_risk(df, student_id, threshold=threshold)
    if res is None:
        return None
    
    return {
        "student_id": str(student_id),
        "is_anomaly": res["is_anomaly"],
        "anomaly_score": res["anomaly_score"],
        "feature_values": res["feature_values"],
        "model": "IsolationForest"
    }
