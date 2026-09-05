"""
Clinical Summary API Endpoints
------------------------------
POST /api/patients/{patient_id}/summary
GET  /api/patients/{patient_id}/summary
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Patient, Report, LabResult, Summary, AuditLog, User
from app.schemas.schemas import SummaryResponse
from app.core.security import get_current_user_optional
from app.services.summary_generator import generate_summary

router = APIRouter(prefix="/api/patients", tags=["Summaries"])


@router.post("/{patient_id}/summary", response_model=SummaryResponse, status_code=status.HTTP_201_CREATED)
def create_patient_summary(
    patient_id: int,
    report_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """
    Generates a patient-friendly, non-diagnostic AI summary.
    Enforces strict safety guardrails and attaches the mandatory disclaimer.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    # Fetch relevant lab results
    query = db.query(LabResult).filter(LabResult.patient_id == patient_id)
    if report_id:
        query = query.filter(LabResult.report_id == report_id)
    results = query.all()

    if not results:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No lab results available for this patient to summarize."
        )

    results_data = [
        {
            "test_name": r.test_name,
            "result_value": r.result_value,
            "unit": r.unit,
            "reference_range_raw": r.reference_range_raw,
            "status": r.status,
            "observation": r.observation
        }
        for r in results
    ]

    report = db.query(Report).filter(Report.id == report_id).first() if report_id else patient.reports[-1] if patient.reports else None
    report_date = report.report_date if report and report.report_date else "Recent"

    summary_dict = generate_summary(
        patient_name=f"{patient.first_name} {patient.last_name}",
        patient_age=patient.age,
        patient_sex=patient.sex,
        symptoms=patient.symptoms,
        medications=patient.current_medications,
        lab_results=results_data,
        report_date=report_date
    )

    summary = Summary(
        patient_id=patient.id,
        report_id=report.id if report else None,
        content=summary_dict["content"],
        key_findings=summary_dict["key_findings"],
        doctor_questions=summary_dict["doctor_questions"],
        disclaimer=summary_dict["disclaimer"]
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)

    # Audit log
    audit = AuditLog(
        patient_id=patient.id,
        user_id=current_user.id if current_user else None,
        action="SUMMARY_GENERATED",
        entity_type="Summary",
        entity_id=summary.id,
        details="Generated responsible non-diagnostic clinical summary"
    )
    db.add(audit)
    db.commit()

    return summary


@router.get("/{patient_id}/summary", response_model=SummaryResponse)
def get_latest_summary(patient_id: int, db: Session = Depends(get_db)):
    """Retrieves the latest summary for a patient."""
    summary = (
        db.query(Summary)
        .filter(Summary.patient_id == patient_id)
        .order_by(Summary.created_at.desc())
        .first()
    )
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No summary found for this patient. Please generate one first."
        )
    return summary
