"""
Patient Management API Endpoints
--------------------------------
POST   /api/patients
GET    /api/patients
GET    /api/patients/{id}
PUT    /api/patients/{id}
DELETE /api/patients/{id}
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models import Patient, User, Report, LabResult, Summary, AuditLog, Conflict
from app.schemas.schemas import PatientCreate, PatientUpdate, PatientResponse, PatientDetailResponse
from app.core.security import get_current_user_optional

router = APIRouter(prefix="/api/patients", tags=["Patients"])


def calculate_completeness_score(patient: Patient) -> Dict[str, Any]:
    """
    Calculates Data Completeness Score (0 - 100%).
    Measures documentation completeness, NOT medical health status!
    """
    total_points = 0
    earned_points = 0

    # 1. Intake Profile Completeness (40 points)
    intake_fields = [
        patient.first_name, patient.last_name, patient.age,
        patient.sex, patient.date_of_birth, patient.symptoms,
        patient.existing_conditions, patient.allergies, patient.current_medications
    ]
    for f in intake_fields:
        total_points += 4
        if f:
            earned_points += 4

    # 2. Lab Verification Completeness (30 points)
    labs = patient.lab_results
    if labs:
        total_points += 30
        verified_count = sum(1 for l in labs if l.is_verified)
        earned_points += int(30 * (verified_count / len(labs)))

    # 3. Conflict Resolution Completeness (30 points)
    conflicts = patient.conflicts
    if conflicts:
        total_points += 30
        resolved_count = sum(1 for c in conflicts if c.status == "RESOLVED")
        earned_points += int(30 * (resolved_count / len(conflicts)))
    else:
        total_points += 10
        earned_points += 10

    score = int((earned_points / max(1, total_points)) * 100)
    return {
        "score": min(100, score),
        "unverified_labs": sum(1 for l in labs if not l.is_verified),
        "pending_conflicts": sum(1 for c in conflicts if c.status == "PENDING"),
        "total_reports": len(patient.reports),
        "total_labs": len(labs)
    }


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """Creates a new patient intake profile with USER PROVIDED provenance."""
    user_id = current_user.id if current_user else None

    patient = Patient(
        user_id=user_id,
        first_name=patient_in.first_name,
        last_name=patient_in.last_name,
        age=patient_in.age,
        sex=patient_in.sex,
        date_of_birth=patient_in.date_of_birth,
        contact_info=patient_in.contact_info if hasattr(patient_in, 'contact_info') else None,
        symptoms=patient_in.symptoms,
        existing_conditions=patient_in.existing_conditions,
        allergies=patient_in.allergies,
        current_medications=patient_in.current_medications,
        previous_history=patient_in.previous_history if hasattr(patient_in, 'previous_history') else None,
        other_info=patient_in.other_info,
        provenance_source="USER PROVIDED"
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    # Record Audit Log
    audit = AuditLog(
        patient_id=patient.id,
        user_id=user_id,
        action="INTAKE_CREATED",
        entity_type="Patient",
        entity_id=patient.id,
        details=f"Patient intake record created for {patient.first_name} {patient.last_name} [Source: USER PROVIDED]"
    )
    db.add(audit)
    db.commit()

    return patient


@router.get("", response_model=List[Dict[str, Any]])
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """Lists patients with live counts, completeness scores, and verification status."""
    query = db.query(Patient)
    if current_user:
        query = query.filter(Patient.user_id == current_user.id)
    patients = query.order_by(Patient.created_at.desc()).all()

    result = []
    for p in patients:
        metrics = calculate_completeness_score(p)
        result.append({
            "id": p.id,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "age": p.age,
            "sex": p.sex,
            "date_of_birth": p.date_of_birth,
            "symptoms": p.symptoms,
            "allergies": p.allergies,
            "current_medications": p.current_medications,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "reports_count": len(p.reports),
            "results_count": len(p.lab_results),
            "completeness_score": metrics["score"],
            "unverified_count": metrics["unverified_labs"],
            "pending_conflicts": metrics["pending_conflicts"]
        })
    return result


@router.get("/{patient_id}")
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Retrieves complete patient record including reports, labs, conflicts, and completeness score."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    metrics = calculate_completeness_score(patient)

    return {
        "id": patient.id,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "age": patient.age,
        "sex": patient.sex,
        "date_of_birth": patient.date_of_birth,
        "contact_info": patient.contact_info,
        "symptoms": patient.symptoms,
        "existing_conditions": patient.existing_conditions,
        "allergies": patient.allergies,
        "current_medications": patient.current_medications,
        "previous_history": patient.previous_history,
        "other_info": patient.other_info,
        "provenance_source": patient.provenance_source or "USER PROVIDED",
        "created_at": patient.created_at,
        "updated_at": patient.updated_at,
        "completeness_metrics": metrics,
        "reports": [
            {
                "id": r.id,
                "file_name": r.file_name,
                "file_type": r.file_type,
                "report_date": r.report_date,
                "lab_facility": r.lab_facility,
                "status": r.status,
                "created_at": r.created_at,
                "results_count": len(r.lab_results),
                "unverified_count": sum(1 for l in r.lab_results if not l.is_verified)
            }
            for r in patient.reports
        ],
        "lab_results": [
            {
                "id": l.id,
                "report_id": l.report_id,
                "test_name": l.test_name,
                "category": l.category,
                "result_value": l.result_value,
                "numeric_value": l.numeric_value,
                "unit": l.unit,
                "reference_range_raw": l.reference_range_raw,
                "status": l.status,
                "source": l.source,
                "source_page": l.source_page,
                "source_text": l.source_text,
                "confidence_level": l.confidence_level,
                "confidence_score": l.confidence_score,
                "is_verified": l.is_verified,
                "is_accepted": l.is_accepted,
                "verified_at": l.verified_at
            }
            for l in patient.lab_results
        ],
        "conflicts": [
            {
                "id": c.id,
                "conflict_type": c.conflict_type,
                "title": c.title,
                "description": c.description,
                "source_a_label": c.source_a_label,
                "source_a_value": c.source_a_value,
                "source_b_label": c.source_b_label,
                "source_b_value": c.source_b_value,
                "status": c.status,
                "resolution": c.resolution
            }
            for c in patient.conflicts
        ]
    }


@router.put("/{patient_id}")
def update_patient(
    patient_id: int,
    update_in: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """Updates intake details and records audit entry."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    update_data = update_in.dict(exclude_unset=True)
    before_state = {k: getattr(patient, k) for k in update_data.keys()}

    for k, v in update_data.items():
        setattr(patient, k, v)

    db.commit()
    db.refresh(patient)

    # Log audit entry
    audit = AuditLog(
        patient_id=patient.id,
        user_id=current_user.id if current_user else None,
        action="INTAKE_UPDATED",
        entity_type="Patient",
        entity_id=patient.id,
        details="Patient intake details updated by user",
        changes={"before": before_state, "after": update_data}
    )
    db.add(audit)
    db.commit()

    return patient


@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """
    Deletes patient record and cascades deletion to reports, lab results, and conflicts.
    Fulfills privacy requirement: 'User can delete patient data'.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    patient_name = f"{patient.first_name} {patient.last_name}"
    db.delete(patient)
    db.commit()

    return {
        "status": "success",
        "message": f"Patient record for '{patient_name}' (ID #{patient_id}) and all associated reports have been permanently deleted."
    }
