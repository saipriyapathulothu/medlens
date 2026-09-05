"""
Medical Report Upload & Processing API Endpoints
------------------------------------------------
POST /api/reports/upload
GET  /api/reports/{id}
POST /api/reports/{id}/process
"""

import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Patient, Report, LabResult, AuditLog, User
from app.schemas.schemas import ReportResponse, ReportDetailResponse
from app.core.security import get_current_user_optional
from app.services.document_processor import extract_text_from_file
from app.services.ai_extractor import extract_lab_data
from app.services.range_evaluator import evaluate_result

router = APIRouter(prefix="/api/reports", tags=["Reports"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def upload_report(
    patient_id: int = Form(...),
    report_date: str = Form(None),
    lab_facility: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """
    Accepts medical report file (PDF, JPG, PNG, TXT).
    Saves file securely and registers report in the database.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower().lstrip('.')
    if ext not in ["pdf", "jpg", "jpeg", "png", "txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF, JPG, PNG, or TXT."
        )

    # Clean filename and save to protected uploads directory
    safe_filename = f"p{patient_id}_{int(os.times().system * 1000)}_{file.filename.replace(' ', '_')}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(saved_path)

    report = Report(
        patient_id=patient.id,
        file_name=file.filename,
        file_path=saved_path,
        file_type=ext,
        file_size=file_size,
        report_date=report_date,
        lab_facility=lab_facility,
        status="uploaded"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Audit log
    audit = AuditLog(
        patient_id=patient.id,
        user_id=current_user.id if current_user else None,
        action="REPORT_UPLOADED",
        entity_type="Report",
        entity_id=report.id,
        details=f"Uploaded report {file.filename} ({file_size} bytes)"
    )
    db.add(audit)
    db.commit()

    return report


@router.get("/{report_id}", response_model=ReportDetailResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    """Retrieves report metadata and structured lab results."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return report


@router.post("/{report_id}/process", response_model=ReportDetailResponse)
def process_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """
    Triggers complete automated processing:
    1. PyMuPDF / OCR text extraction
    2. AI / Structured JSON extraction
    3. Deterministic reference range evaluation (LOW / NORMAL / HIGH / NOT_DETERMINED)
    4. Database persistence and audit logging
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    report.status = "processing"
    db.commit()

    # Step 1: Text extraction
    extracted = extract_text_from_file(report.file_path, report.file_type)
    raw_text = extracted.get("text", "")
    report.raw_text = raw_text

    if not raw_text.strip():
        report.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract any readable text from this document."
        )

    # Step 2: Structured lab extraction
    raw_tests = extract_lab_data(raw_text)

    # Delete any existing results for this report if re-processing
    db.query(LabResult).filter(LabResult.report_id == report.id).delete()

    # Step 3: Evaluate each test deterministically
    created_results = []
    for t in raw_tests:
        evaluation = evaluate_result(t.get("result"), t.get("reference_range"))

        lab_result = LabResult(
            report_id=report.id,
            patient_id=report.patient_id,
            test_name=t.get("test_name", "Unknown Test"),
            category=t.get("category", "General"),
            result_value=str(t.get("result", "")),
            numeric_value=evaluation.get("numeric_value"),
            unit=t.get("unit", ""),
            reference_range_raw=t.get("reference_range"),
            ref_min=evaluation.get("ref_min"),
            ref_max=evaluation.get("ref_max"),
            status=evaluation.get("status", "NOT_DETERMINED"),
            observation=evaluation.get("observation") or t.get("observation"),
            source_text=t.get("source_text"),
            source_type="report_extracted",
            confidence_score=t.get("confidence_score", 0.95),
            is_verified=False
        )
        db.add(lab_result)
        created_results.append(lab_result)

    report.status = "completed"
    db.commit()
    db.refresh(report)

    # Step 4: Audit log
    audit = AuditLog(
        patient_id=report.patient_id,
        user_id=current_user.id if current_user else None,
        action="REPORT_PROCESSED",
        entity_type="Report",
        entity_id=report.id,
        details=f"Processed {len(created_results)} structured lab results via deterministic engine."
    )
    db.add(audit)
    db.commit()

    return report
