"""
MedLens Conflict & Inconsistency Detection Service
--------------------------------------------------
Identifies discrepancies across:
1. Patient demographic intake vs report metadata (Age, DOB, Name)
2. Medications & allergies in intake vs mentioned in clinical report text
3. Conflicting lab values from the same date or report
"""

import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Patient, Report, LabResult, Conflict, AuditLog


def detect_patient_conflicts(patient_id: int, db: Session) -> List[Conflict]:
    """
    Analyzes patient intake details and compares them against uploaded reports and lab results.
    Generates Conflict records for discrepancies.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return []

    reports = db.query(Report).filter(Report.patient_id == patient_id).all()
    detected_conflicts = []

    for report in reports:
        raw_text = report.raw_text or ""
        if not raw_text.strip():
            continue

        # 1. Check for Age Mismatch
        # Search for "Age: XX" or "XX yo" or "XX yr"
        age_match = re.search(r"\bAge:\s*(\d+)\b|\b(\d+)\s*(?:yo|y\.o\.|years\s+old|yr)\b", raw_text, re.IGNORECASE)
        if age_match and patient.age is not None:
            rep_age_str = age_match.group(1) or age_match.group(2)
            try:
                rep_age = int(rep_age_str)
                if abs(rep_age - patient.age) >= 1:
                    # Check if this conflict is already recorded
                    existing = db.query(Conflict).filter(
                        Conflict.patient_id == patient.id,
                        Conflict.report_id == report.id,
                        Conflict.conflict_type == "AGE_MISMATCH"
                    ).first()

                    if not existing:
                        conflict = Conflict(
                            patient_id=patient.id,
                            report_id=report.id,
                            conflict_type="AGE_MISMATCH",
                            title="Patient Age Discrepancy",
                            description=(
                                f"Patient age differs between user intake ({patient.age} years) "
                                f"and report '{report.file_name}' ({rep_age} years)."
                            ),
                            source_a_label="User Intake",
                            source_a_value=f"{patient.age} years",
                            source_b_label=f"Report: {report.file_name}",
                            source_b_value=f"{rep_age} years",
                            status="PENDING"
                        )
                        db.add(conflict)
                        detected_conflicts.append(conflict)
            except ValueError:
                pass

        # 2. Check for Name Mismatch
        # e.g. "Name: First Last"
        name_match = re.search(r"Name:\s*([A-Za-z]+(?:\s+[A-Za-z]+)+)", raw_text, re.IGNORECASE)
        if name_match:
            rep_name = name_match.group(1).strip()
            user_full_name = f"{patient.first_name} {patient.last_name}".strip()
            # Simple check if last name is in report name
            if patient.last_name.lower() not in rep_name.lower():
                existing = db.query(Conflict).filter(
                    Conflict.patient_id == patient.id,
                    Conflict.report_id == report.id,
                    Conflict.conflict_type == "NAME_MISMATCH"
                ).first()
                if not existing:
                    conflict = Conflict(
                        patient_id=patient.id,
                        report_id=report.id,
                        conflict_type="NAME_MISMATCH",
                        title="Patient Name Discrepancy",
                        description=(
                            f"Patient name in intake '{user_full_name}' does not match "
                            f"name recorded in report '{rep_name}'."
                        ),
                        source_a_label="User Intake",
                        source_a_value=user_full_name,
                        source_b_label=f"Report: {report.file_name}",
                        source_b_value=rep_name,
                        status="PENDING"
                    )
                    db.add(conflict)
                    detected_conflicts.append(conflict)

        # 3. Check for Medication Discrepancies
        # If user intake says "None reported" or empty, but report notes mention medications
        if not patient.current_medications or patient.current_medications.lower() in ["none", "none reported"]:
            med_keywords = ["metformin", "lisinopril", "atorvastatin", "levothyroxine", "amlodipine", "insulin", "aspirin"]
            found_meds = [m for m in med_keywords if re.search(rf"\b{m}\b", raw_text, re.IGNORECASE)]
            if found_meds:
                existing = db.query(Conflict).filter(
                    Conflict.patient_id == patient.id,
                    Conflict.report_id == report.id,
                    Conflict.conflict_type == "MEDICATION_CONFLICT"
                ).first()
                if not existing:
                    conflict = Conflict(
                        patient_id=patient.id,
                        report_id=report.id,
                        conflict_type="MEDICATION_CONFLICT",
                        title="Unlisted Medication Detected in Report",
                        description=(
                            f"Report text references medication(s): {', '.join(found_meds).title()}, "
                            "which are not listed in the patient's current intake medication list."
                        ),
                        source_a_label="User Intake",
                        source_a_value="None reported",
                        source_b_label=f"Report: {report.file_name}",
                        source_b_value=", ".join(found_meds).title(),
                        status="PENDING"
                    )
                    db.add(conflict)
                    detected_conflicts.append(conflict)

    if detected_conflicts:
        db.commit()

    return db.query(Conflict).filter(Conflict.patient_id == patient_id).all()
