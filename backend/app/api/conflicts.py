"""
Conflict & Inconsistency API Endpoints
--------------------------------------
GET  /api/patients/{patient_id}/conflicts
POST /api/conflicts/{conflict_id}/resolve
"""

import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Patient, Conflict, AuditLog, User
from app.core.security import get_current_user_optional
from app.services.conflict_detector import detect_patient_conflicts

router = APIRouter(prefix="/api", tags=["Conflicts"])


class ConflictResponse(BaseModel):
    id: int
    patient_id: int
    report_id: Optional[int] = None
    conflict_type: str
    title: str
    description: str
    source_a_label: str
    source_a_value: str
    source_b_label: str
    source_b_value: str
    status: str
    resolution: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ResolveConflictRequest(BaseModel):
    resolution: str  # "KEEP_A", "KEEP_B", "CUSTOM", "DISMISSED"
    custom_value: Optional[str] = None
    notes: Optional[str] = None


@router.get("/patients/{patient_id}/conflicts", response_model=List[ConflictResponse])
def get_patient_conflicts(patient_id: int, db: Session = Depends(get_db)):
    """Runs inconsistency detection and returns all detected conflicts for a patient."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    conflicts = detect_patient_conflicts(patient_id, db)
    return conflicts


@router.post("/conflicts/{conflict_id}/resolve", response_model=ConflictResponse)
def resolve_conflict(
    conflict_id: int,
    req: ResolveConflictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """
    Resolves an information conflict.
    Never auto-decides; allows the human user to decide which value to preserve.
    """
    conflict = db.query(Conflict).filter(Conflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conflict not found.")

    patient = conflict.patient

    # Apply resolution to patient if KEEP_B or CUSTOM
    if req.resolution == "KEEP_B":
        if conflict.conflict_type == "AGE_MISMATCH":
            try:
                # Extract numeric age from report string
                nums = [int(s) for s in conflict.source_b_value.split() if s.isdigit()]
                if nums:
                    patient.age = nums[0]
            except Exception:
                pass
        elif conflict.conflict_type == "MEDICATION_CONFLICT":
            if patient.current_medications:
                patient.current_medications += f", {conflict.source_b_value}"
            else:
                patient.current_medications = conflict.source_b_value
    elif req.resolution == "CUSTOM" and req.custom_value:
        if conflict.conflict_type == "AGE_MISMATCH":
            try:
                patient.age = int(req.custom_value)
            except Exception:
                pass

    conflict.status = "RESOLVED"
    conflict.resolution = req.resolution
    conflict.resolution_notes = req.notes or f"Resolved by user as {req.resolution}"
    conflict.resolved_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(conflict)

    # Record Audit Log
    audit = AuditLog(
        patient_id=patient.id,
        user_id=current_user.id if current_user else None,
        action="CONFLICT_RESOLVED",
        entity_type="Conflict",
        entity_id=conflict.id,
        details=f"Conflict '{conflict.title}' resolved as {req.resolution} ({conflict.resolution_notes})"
    )
    db.add(audit)
    db.commit()

    return conflict
