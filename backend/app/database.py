"""
MedLens Database Configuration
------------------------------
Sets up the SQLite database connection using SQLAlchemy.
SQLite is a lightweight, single-file database that requires no external setup.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Define the SQLite database file path.
# In SQLite, "sqlite:///./medlens.db" creates a file named "medlens.db" in the backend directory.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./medlens.db")

# create_engine establishes the connection to the SQLite database file.
# "check_same_thread": False is needed only for SQLite because FastAPI handles
# multiple web requests concurrently across different threads.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# SessionLocal is a factory that gives each API request its own independent database session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class that all database model tables inherit from.
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a database session for each request,
    and ensures the session is properly closed when the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Creates all database tables defined in models.py if they don't already exist.
    """
    from app import models
    Base.metadata.create_all(bind=engine)
    print("✓ SQLite database initialized successfully: medlens.db")
