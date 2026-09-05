"""
Lab Results & Human Verification API Endpoints
----------------------------------------------
GET  /api/reports/{report_id}/results
GET  /api/patients/{patient_id}/results
PUT  /api/lab-results/{id}
POST /api/lab-results/{id}/verify
POST /api/lab-results/{id}/accept
POST /api/lab-results/{id}/reject
POST /api/reports/{report_id}/accept-all
"""

import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import LabResult, AuditLog, User, Report
from app.schemas.schemas import LabResultResponse, LabResultUpdate, LabResultVerifyRequest
from app.core.security import get_current_user_optional
from app.services.range_evaluator import evaluate_result

router = APIRouter(prefix="/api", tags=["Lab Results"])


class RejectLabRequest(BaseModel):
    reason: str


@router.get("/reports/{report_id}/results")
def get_report_results(report_id: int, db: Session = Depends(get_db)):
    """Retrieves all structured lab results extracted from a specific report."""
    results = db.query(LabResult).filter(LabResult.report_id == report_id).all()
    return [
        {
            "id": r.id,
            "report_id": r.report_id,
            "patient_id": r.patient_id,
            "test_name": r.test_name,
            "category": r.category,
            "result_value": r.result_value,
            "numeric_value": r.numeric_value,
            "unit": r.unit,
            "reference_range_raw": r.reference_range_raw,
            "reference_low": r.reference_low,
            "reference_high": r.reference_high,
            "status": r.status,
            "observation": r.observation,
            "source": r.source,
            "source_document": r.source_document,
            "source_page": r.source_page or 1,
            "source_text": r.source_text,
            "confidence_level": r.confidence_level or ("HIGH" if (r.confidence_score or 1.0) >= 0.85 else "MEDIUM" if (r.confidence_score or 1.0) >= 0.65 else "LOW"),
            "confidence_score": r.confidence_score or 0.95,
            "is_verified": r.is_verified,
            "is_accepted": r.is_accepted if hasattr(r, 'is_accepted') else True,
            "verified_at": r.verified_at
        }
        for r in results
    ]


@router.put("/lab-results/{result_id}")
def update_lab_result(
    result_id: int,
    update_in: LabResultUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """
    Allows human review and editing of an extracted lab result.
    Re-runs deterministic range evaluator strictly using the provided range.
    """
    lab = db.query(LabResult).filter(LabResult.id == result_id).first()
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab result not found.")

    before_state = {
        "result_value": lab.result_value,
        "reference_range_raw": lab.reference_range_raw,
        "status": lab.status
    }

    if update_in.test_name is not None:
        lab.test_name = update_in.test_name
    if update_in.unit is not None:
        lab.unit = update_in.unit
    if update_in.observation is not None:
        lab.observation = update_in.observation

    # Re-evaluate deterministically if value or range changes
    if update_in.result_value is not None or update_in.reference_range_raw is not None:
        new_val = update_in.result_value if update_in.result_value is not None else lab.result_value
        new_range = update_in.reference_range_raw if update_in.reference_range_raw is not None else lab.reference_range_raw

        evaluation = evaluate_result(new_val, new_range)
        lab.result_value = str(new_val)
        lab.numeric_value = evaluation.get("numeric_value")
        lab.reference_range_raw = new_range
        lab.reference_low = evaluation.get("reference_low")
        lab.reference_high = evaluation.get("reference_high")
        lab.status = evaluation.get("status", "UNKNOWN")
        lab.source = "USER MODIFIED"

    db.commit()
    db.refresh(lab)

    # Audit log
    audit = AuditLog(
        patient_id=lab.patient_id,
        user_id=current_user.id if current_user else None,
        action="RESULT_EDITED",
        entity_type="LabResult",
        entity_id=lab.id,
        details=f"Edited test {lab.test_name}: {before_state['result_value']} -> {lab.result_value} [Status: {lab.status}]",
        changes={"before": before_state, "after": {"result_value": lab.result_value, "status": lab.status}}
    )
    db.add(audit)
    db.commit()

    return lab


@router.post("/lab-results/{result_id}/verify")
def verify_lab_result(
    result_id: int,
    verify_req: LabResultVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """
    Human verification: confirms extracted value matches source document.
    Updates provenance: REPORT EXTRACTED -> USER VERIFIED.
    """
    lab = db.query(LabResult).filter(LabResult.id == result_id).first()
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab result not found.")

    lab.is_verified = verify_req.verified
    lab.is_accepted = True
    lab.verified_by = current_user.id if current_user else None
    lab.verified_at = datetime.datetime.utcnow() if verify_req.verified else None
    lab.source = "REPORT EXTRACTED -> USER VERIFIED" if verify_req.verified else "REPORT EXTRACTED"

    if verify_req.clinical_note:
        lab.observation = (lab.observation or "") + f" | Verified: {verify_req.clinical_note}"

    db.commit()
    db.refresh(lab)

    # Audit Log
    audit = AuditLog(
        patient_id=lab.patient_id,
        user_id=current_user.id if current_user else None,
        action="RESULT_VERIFIED" if verify_req.verified else "VERIFICATION_REVOKED",
        entity_type="LabResult",
        entity_id=lab.id,
        details=f"Test '{lab.test_name}' confirmed and verified against source document."
    )
    db.add(audit)
    db.commit()

    return lab


@router.post("/lab-results/{result_id}/accept")
def accept_lab_result(result_id: int, db: Session = Depends(get_db)):
    """Accepts an extracted field in the human review queue."""
    lab = db.query(LabResult).filter(LabResult.id == result_id).first()
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab result not found.")

    lab.is_accepted = True
    lab.rejection_reason = None
    db.commit()
    return {"status": "accepted", "id": lab.id}


@router.post("/lab-results/{result_id}/reject")
def reject_lab_result(result_id: int, req: RejectLabRequest, db: Session = Depends(get_db)):
    """Rejects an incorrectly extracted field from the patient record."""
    lab = db.query(LabResult).filter(LabResult.id == result_id).first()
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab result not found.")

    lab.is_accepted = False
    lab.rejection_reason = req.reason
    db.commit()
    return {"status": "rejected", "id": lab.id, "reason": req.reason}


@router.post("/reports/{report_id}/accept-all")
def accept_all_results(report_id: int, db: Session = Depends(get_db)):
    """Batch accepts all extracted lab results for a report."""
    labs = db.query(LabResult).filter(LabResult.report_id == report_id).all()
    for l in labs:
        l.is_accepted = True
        l.is_verified = True
        l.source = "REPORT EXTRACTED -> USER VERIFIED"
        l.verified_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success", "accepted_count": len(labs)}
