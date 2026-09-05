"""
Clinical Export & Demo Data API Endpoints
-----------------------------------------
GET  /api/reports/{report_id}/export-pdf
GET  /api/patients/{patient_id}/export-pdf
GET  /api/patients/{patient_id}/export-json
GET  /api/patients/{patient_id}/export-csv
POST /api/seed-demo-data
"""

import io
import csv
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Patient, Report, LabResult, Summary, AuditLog, Conflict, User
from app.core.security import get_current_user_optional
from app.services.pdf_exporter import generate_clinical_pdf
from app.services.demo_seeder import seed_demo_data

router = APIRouter(prefix="/api", tags=["Export & Demo"])


@router.post("/seed-demo-data")
def trigger_seed_demo_data(db: Session = Depends(get_db)):
    """Seeds synthetic Patient A and Patient B with multiple reports, conflicts, and labs."""
    return seed_demo_data(db)


@router.get("/patients/{patient_id}/export-json")
def export_patient_json(patient_id: int, db: Session = Depends(get_db)):
    """Exports entire structured patient record with provenance and audit logs in JSON format."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    export_obj = {
        "export_metadata": {
            "application": "MedLens — AI-Powered Clinical Information Intelligence",
            "export_date": str(patient.updated_at),
            "disclaimer": "MedLens helps organize and explain medical information. It does not provide medical diagnosis or treatment advice. Always consult a qualified healthcare professional for medical decisions.",
            "synthetic_notice": "SYNTHETIC DEMO DATA — NOT REAL PATIENT INFORMATION" if "synthetic" in (patient.other_info or "").lower() or "synthetic" in (patient.contact_info or "").lower() else "CONFIDENTIAL PATIENT RECORD"
        },
        "patient_intake": {
            "id": patient.id,
            "name": f"{patient.first_name} {patient.last_name}",
            "age": patient.age,
            "sex": patient.sex,
            "date_of_birth": patient.date_of_birth,
            "symptoms": patient.symptoms,
            "existing_conditions": patient.existing_conditions,
            "allergies": patient.allergies,
            "current_medications": patient.current_medications,
            "provenance": patient.provenance_source or "USER PROVIDED"
        },
        "reports": [
            {
                "id": r.id,
                "file_name": r.file_name,
                "report_date": r.report_date,
                "lab_facility": r.lab_facility,
                "status": r.status
            }
            for r in patient.reports
        ],
        "laboratory_results": [
            {
                "test_name": l.test_name,
                "result_value": l.result_value,
                "unit": l.unit,
                "reference_range": l.reference_range_raw,
                "status": l.status,
                "source": l.source,
                "source_document": l.source_document,
                "source_page": l.source_page,
                "source_text": l.source_text,
                "confidence_level": l.confidence_level,
                "is_verified": l.is_verified
            }
            for l in patient.lab_results
        ],
        "conflicts": [
            {
                "type": c.conflict_type,
                "title": c.title,
                "status": c.status,
                "source_a": f"{c.source_a_label}: {c.source_a_value}",
                "source_b": f"{c.source_b_label}: {c.source_b_value}",
                "resolution": c.resolution
            }
            for c in patient.conflicts
        ]
    }

    json_str = json.dumps(export_obj, indent=2)
    filename = f"MedLens_Patient_{patient.last_name}_{patient.id}.json"
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/patients/{patient_id}/export-csv")
def export_patient_csv(patient_id: int, db: Session = Depends(get_db)):
    """Exports structured laboratory results as a clean CSV spreadsheet."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Patient ID", "Patient Name", "Test Name", "Result Value", "Unit",
        "Reference Range", "Status", "Source Document", "Page", "Confidence", "Verified Status"
    ])

    for l in patient.lab_results:
        writer.writerow([
            patient.id,
            f"{patient.first_name} {patient.last_name}",
            l.test_name,
            l.result_value,
            l.unit or "",
            l.reference_range_raw or "Not Specified",
            l.status,
            l.source_document or "",
            l.source_page or 1,
            l.confidence_level or "HIGH",
            "Verified" if l.is_verified else "Pending Review"
        ])

    output.seek(0)
    filename = f"MedLens_Labs_{patient.last_name}_{patient.id}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/reports/{report_id}/export-pdf")
def export_report_pdf(report_id: int, db: Session = Depends(get_db)):
    """Streams a formal clinical summary PDF for an uploaded report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    patient = report.patient
    summary = (
        db.query(Summary)
        .filter(Summary.report_id == report.id)
        .order_by(Summary.created_at.desc())
        .first()
    )

    patient_info = {
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "age": patient.age,
        "sex": patient.sex,
        "date_of_birth": patient.date_of_birth,
        "symptoms": patient.symptoms,
        "allergies": patient.allergies,
        "current_medications": patient.current_medications
    }

    report_info = {
        "file_name": report.file_name,
        "report_date": report.report_date,
        "lab_facility": report.lab_facility
    }

    lab_results = [
        {
            "test_name": r.test_name,
            "result_value": r.result_value,
            "unit": r.unit,
            "reference_range_raw": r.reference_range_raw,
            "status": r.status
        }
        for r in report.lab_results
    ]

    summary_text = summary.content if summary else None
    pdf_buffer = generate_clinical_pdf(patient_info, report_info, lab_results, summary_text)

    filename = f"MedLens_{patient.last_name}_{report.id}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/patients/{patient_id}/export-pdf")
def export_patient_pdf(patient_id: int, db: Session = Depends(get_db)):
    """Streams comprehensive clinical summary PDF across all patient records."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    patient_info = {
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "age": patient.age,
        "sex": patient.sex,
        "date_of_birth": patient.date_of_birth,
        "symptoms": patient.symptoms,
        "allergies": patient.allergies,
        "current_medications": patient.current_medications
    }

    lab_results = [
        {
            "test_name": r.test_name,
            "result_value": r.result_value,
            "unit": r.unit,
            "reference_range_raw": r.reference_range_raw,
            "status": r.status
        }
        for r in patient.lab_results
    ]

    latest_summary = (
        db.query(Summary)
        .filter(Summary.patient_id == patient.id)
        .order_by(Summary.created_at.desc())
        .first()
    )

    pdf_buffer = generate_clinical_pdf(
        patient_info=patient_info,
        report_info=None,
        lab_results=lab_results,
        summary_text=latest_summary.content if latest_summary else None
    )

    filename = f"MedLens_PatientRecord_{patient.last_name}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
