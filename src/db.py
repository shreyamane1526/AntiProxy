"""Database connectivity and data ingestion for AntiProxy.

Provides unified DataFrame loading from PostgreSQL or synthetic CSV data.
The data source is switchable via the DATA_SOURCE environment variable ('fake' or 'postgres').
"""

import os
from typing import Optional
from dotenv import load_dotenv
import pandas as pd
from sqlalchemy import create_engine, text

from src.generate_fake_data import save_fake_data

# Load .env file from project root
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/antiproxy")
DATA_SOURCE = os.getenv("DATA_SOURCE", "fake").lower()


def get_db_engine(database_url: Optional[str] = None):
    """Create and return a SQLAlchemy database engine."""
    url = database_url or DATABASE_URL
    return create_engine(url)


def load_data_from_postgres(database_url: Optional[str] = None) -> pd.DataFrame:
    """Load attendance records from PostgreSQL database via relational JOIN query.
    
    Returns a flat pandas DataFrame with columns:
    student_id, name, division, subject, session_date, status
    """
    engine = get_db_engine(database_url)
    
    query = """
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
    ORDER BY sess.session_date ASC, s.id ASC
    """
    
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        
    df["session_date"] = df["session_date"].astype(str)
    return df


def load_data_fake(csv_path: Optional[str] = None) -> pd.DataFrame:
    """Load attendance records from synthetic CSV file.
    
    If the file does not exist, automatically triggers data generation.
    """
    if csv_path is None:
        csv_path = os.path.join(base_dir, "data", "fake_attendance.csv")
        
    if not os.path.exists(csv_path):
        save_fake_data(os.path.dirname(csv_path))
        
    df = pd.read_csv(csv_path)
    df["session_date"] = df["session_date"].astype(str)
    return df


def get_attendance_data(source: Optional[str] = None, csv_path: Optional[str] = None) -> pd.DataFrame:
    """Retrieve attendance data from either synthetic CSV or PostgreSQL based on configuration."""
    active_source = (source or os.getenv("DATA_SOURCE", "fake")).lower()
    
    if active_source == "postgres":
        return load_data_from_postgres()
    else:
        return load_data_fake(csv_path)
