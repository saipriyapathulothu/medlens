"""
MedLens Database Models
-----------------------
Defines all database tables for MedLens:
1. users: Account authentication & roles
2. patients: Patient demographic & health intake details (provenance: USER_PROVIDED)
3. reports: Uploaded medical documents (PDF/JPG/PNG)
4. lab_results: Extracted lab tests with deterministic reference range checks & provenance
5. conflicts: Detected inconsistencies between intake and reports
6. summaries: Patient-friendly non-diagnostic AI summaries
7. audit_logs: Provenance and history of all edits & verifications
"""

import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    JSON
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """Stores user accounts (clinicians, patients, caregivers)."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="clinician")  # "patient" or "clinician"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patients = relationship("Patient", back_populates="creator")
    audit_logs = relationship("AuditLog", back_populates="user")


class Patient(Base):
    """Stores patient intake information with provenance."""
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Basic Information
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    sex = Column(String, nullable=True)  # "Male", "Female", "Other"
    date_of_birth = Column(String, nullable=True)  # YYYY-MM-DD
    contact_info = Column(String, nullable=True)

    # Medical Information (Provenance = USER PROVIDED)
    symptoms = Column(Text, nullable=True)
    existing_conditions = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    previous_history = Column(Text, nullable=True)
    other_info = Column(Text, nullable=True)

    # Provenance
    provenance_source = Column(String, default="USER PROVIDED")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="patients")
    reports = relationship("Report", back_populates="patient", cascade="all, delete-orphan")
    lab_results = relationship("LabResult", back_populates="patient", cascade="all, delete-orphan")
    conflicts = relationship("Conflict", back_populates="patient", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="patient", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="patient", cascade="all, delete-orphan")


class Report(Base):
    """Stores uploaded medical reports (PDF, JPG, PNG)."""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # "pdf", "jpg", "png", "txt"
    file_size = Column(Integer, nullable=True)
    report_date = Column(String, nullable=True)  # YYYY-MM-DD
    lab_facility = Column(String, nullable=True) # e.g. "Quest Diagnostics"
    report_type = Column(String, default="Laboratory Report")
    doctor_name = Column(String, nullable=True)

    status = Column(String, default="uploaded")  # "uploaded", "processing", "completed", "failed"
    raw_text = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="reports")
    lab_results = relationship("LabResult", back_populates="report", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="report")


class LabResult(Base):
    """
    Stores individual extracted lab test results.
    Reference ranges are ONLY derived from the uploaded source document.
    Statuses: LOW, NORMAL, HIGH, UNKNOWN, NOT_ASSESSABLE, POSITIVE, NEGATIVE, REACTIVE, NON-REACTIVE.
    """
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    test_name = Column(String, nullable=False)
    category = Column(String, default="General")
    result_value = Column(String, nullable=False)
    numeric_value = Column(Float, nullable=True)
    unit = Column(String, nullable=True)

    # Reference Range strictly from source
    reference_range_raw = Column(String, nullable=True)
    reference_low = Column(Float, nullable=True)
    reference_high = Column(Float, nullable=True)

    # Status: LOW | NORMAL | HIGH | UNKNOWN | NOT_ASSESSABLE | POSITIVE | NEGATIVE | REACTIVE | NON-REACTIVE
    status = Column(String, default="UNKNOWN")
    observation = Column(String, nullable=True)

    # Provenance & Confidence System
    source = Column(String, default="REPORT EXTRACTED")  # "USER PROVIDED", "REPORT EXTRACTED", "AI GENERATED", "USER VERIFIED"
    source_document = Column(String, nullable=True)
    source_page = Column(Integer, default=1)
    source_text = Column(Text, nullable=True)
    confidence_level = Column(String, default="HIGH")    # "HIGH", "MEDIUM", "LOW"
    confidence_score = Column(Float, default=0.95)

    # Verification workflow
    is_verified = Column(Boolean, default=False)
    is_accepted = Column(Boolean, default=True)
    rejection_reason = Column(String, nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    report = relationship("Report", back_populates="lab_results")
    patient = relationship("Patient", back_populates="lab_results")


class Conflict(Base):
    """Stores detected inconsistencies between intake and reports or between reports."""
    __tablename__ = "conflicts"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)

    conflict_type = Column(String, nullable=False)  # "AGE_MISMATCH", "NAME_MISMATCH", "DOB_MISMATCH", "MEDICATION_CONFLICT", "LAB_ANOMALY"
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    source_a_label = Column(String, default="User Provided")
    source_a_value = Column(String, nullable=False)

    source_b_label = Column(String, default="Report Extracted")
    source_b_value = Column(String, nullable=False)

    status = Column(String, default="PENDING")  # "PENDING", "RESOLVED"
    resolution = Column(String, nullable=True)  # "KEEP_USER", "KEEP_REPORT", "CUSTOM", "DISMISSED"
    resolution_notes = Column(Text, nullable=True)

    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="conflicts")


class Summary(Base):
    """Stores patient-friendly, non-diagnostic clinical summaries."""
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)

    content = Column(Text, nullable=False)
    key_findings = Column(JSON, nullable=True)
    doctor_questions = Column(JSON, nullable=True)
    data_quality_notes = Column(Text, nullable=True)
    missing_info_notes = Column(Text, nullable=True)

    disclaimer = Column(
        Text,
        default=(
            "MedLens helps organize and explain medical information. "
            "It does not provide medical diagnosis or treatment advice. "
            "Always consult a qualified healthcare professional for medical decisions."
        )
    )

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="summaries")
    report = relationship("Report", back_populates="summaries")


class AuditLog(Base):
    """Tracks full audit history and data provenance for all changes."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    changes = Column(JSON, nullable=True)

    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")
