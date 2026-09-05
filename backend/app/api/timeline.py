"""
Patient Audit Trail & Provenance Timeline API
---------------------------------------------
GET /api/patients/{patient_id}/timeline
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Patient, AuditLog
from app.schemas.schemas import AuditLogResponse

router = APIRouter(prefix="/api/patients", tags=["Timeline"])


@router.get("/{patient_id}/timeline", response_model=List[AuditLogResponse])
def get_patient_timeline(patient_id: int, db: Session = Depends(get_db)):
    """
    Returns the chronological history of all actions performed for a patient:
    - Profile creations and updates
    - Report uploads & processing runs
    - Lab result human edits and verification events
    - Clinical summary generations
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.patient_id == patient_id)
        .order_by(AuditLog.timestamp.desc())
        .all()
    )
    return logs
