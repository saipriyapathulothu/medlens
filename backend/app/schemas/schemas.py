"""
MedLens Pydantic Schemas
------------------------
Defines request and response data contracts for all API endpoints.
Validates inputs and serializes outputs.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ------------------ Authentication Schemas ------------------
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "patient"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ------------------ Patient Schemas ------------------
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    age: Optional[int] = None
    sex: Optional[str] = None
    date_of_birth: Optional[str] = None
    symptoms: Optional[str] = None
    existing_conditions: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None
    other_info: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    date_of_birth: Optional[str] = None
    symptoms: Optional[str] = None
    existing_conditions: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None
    other_info: Optional[str] = None


# ------------------ Lab Result Schemas ------------------
class LabResultResponse(BaseModel):
    id: int
    report_id: int
    patient_id: int
    test_name: str
    category: Optional[str] = "General"
    result_value: str
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    reference_range_raw: Optional[str] = None
    ref_min: Optional[float] = None
    ref_max: Optional[float] = None
    status: str  # LOW, NORMAL, HIGH, NOT_DETERMINED, NEEDS_VERIFICATION
    observation: Optional[str] = None
    source_text: Optional[str] = None
    source_type: Optional[str] = "report_extracted"
    confidence_score: Optional[float] = 1.0
    is_verified: bool = False
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LabResultUpdate(BaseModel):
    test_name: Optional[str] = None
    result_value: Optional[str] = None
    unit: Optional[str] = None
    reference_range_raw: Optional[str] = None
    observation: Optional[str] = None


class LabResultVerifyRequest(BaseModel):
    verified: bool = True
    clinical_note: Optional[str] = None


# ------------------ Report Schemas ------------------
class ReportResponse(BaseModel):
    id: int
    patient_id: int
    file_name: str
    file_type: str
    file_size: Optional[int] = None
    report_date: Optional[str] = None
    lab_facility: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReportDetailResponse(ReportResponse):
    raw_text: Optional[str] = None
    lab_results: List[LabResultResponse] = []


# ------------------ Summary Schemas ------------------
class SummaryResponse(BaseModel):
    id: int
    patient_id: int
    report_id: Optional[int] = None
    content: str
    key_findings: Optional[List[Dict[str, Any]]] = None
    doctor_questions: Optional[List[str]] = None
    disclaimer: str
    created_at: datetime

    class Config:
        from_attributes = True


# ------------------ Audit Log Schemas ------------------
class AuditLogResponse(BaseModel):
    id: int
    patient_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    details: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# ------------------ Patient Detail with Children ------------------
class PatientResponse(PatientBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    reports_count: Optional[int] = 0
    results_count: Optional[int] = 0

    class Config:
        from_attributes = True


class PatientDetailResponse(PatientResponse):
    reports: List[ReportResponse] = []
    lab_results: List[LabResultResponse] = []
    summaries: List[SummaryResponse] = []
