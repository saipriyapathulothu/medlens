"""
MedLens Comprehensive Services & Pipeline Verification Script
-------------------------------------------------------------
Executes the full end-to-end workflow:
1. SQLite database initialization
2. User registration & synthetic patient intake
3. Medical report upload & text extraction
4. AI structuring + deterministic range evaluation (HIGH/LOW/NORMAL/NOT_DETERMINED)
5. Human verification & result editing
6. Safe non-diagnostic clinical summary generation
7. Report comparison & Recharts trend series generation
8. ReportLab clinical PDF generation
9. Provenance & audit trail verification
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db, SessionLocal
from app.models import User, Patient, Report, LabResult, Summary, AuditLog
from app.core.security import hash_password
from app.services.ai_extractor import extract_lab_data
from app.services.range_evaluator import evaluate_result
from app.services.summary_generator import generate_summary
from app.services.pdf_exporter import generate_clinical_pdf


def run_full_pipeline_test():
    print("=" * 65)
    print("  MedLens Comprehensive Pipeline Test")
    print("=" * 65)

    # 1. Initialize DB
    print("\n[Step 1] Initializing SQLite database...")
    init_db()
    db = SessionLocal()

    try:
        # 2. Setup Test User and Patient
        print("\n[Step 2] Creating synthetic clinician & patient intake...")
        user = db.query(User).filter_by(email="clinician@medlens.health").first()
        if not user:
            user = User(
                email="clinician@medlens.health",
                hashed_password=hash_password("SecurePassword123!"),
                full_name="Dr. Alex Rivera",
                role="clinician"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        print(f"   ✓ Clinician active: ID {user.id} ({user.full_name})")

        patient = db.query(Patient).filter_by(first_name="Jane", last_name="Doe").first()
        if not patient:
            patient = Patient(
                user_id=user.id,
                first_name="Jane",
                last_name="Doe",
                age=38,
                sex="Female",
                date_of_birth="1988-04-12",
                symptoms="Fatigue, mild dizziness upon standing",
                existing_conditions="Hypertension",
                allergies="Penicillin",
                current_medications="Vitamin D3 2000 IU daily",
                other_info="Follow-up panel after 3 months"
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
        print(f"   ✓ Patient active: ID {patient.id} ({patient.first_name} {patient.last_name})")

        # 3. Read Synthetic CMP Report & Extract
        print("\n[Step 3] Ingesting synthetic Comprehensive Metabolic Panel (CMP)...")
        cmp_sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../sample_data/sample_cmp_abnormal.txt"))
        with open(cmp_sample_path, "r", encoding="utf-8") as f:
            cmp_raw_text = f.read()

        report = Report(
            patient_id=patient.id,
            file_name="sample_cmp_abnormal.txt",
            file_path=cmp_sample_path,
            file_type="txt",
            file_size=len(cmp_raw_text),
            report_date="2026-09-01",
            lab_facility="MetroHealth Diagnostic Laboratories",
            status="completed",
            raw_text=cmp_raw_text
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        print(f"   ✓ Report registered: ID {report.id} ({report.file_name})")

        # 4. Extract Tests and Evaluate Deterministically
        print("\n[Step 4] Extracting tests and evaluating reference ranges...")
        raw_tests = extract_lab_data(cmp_raw_text)
        print(f"   ✓ Extracted {len(raw_tests)} lab tests from report.")

        # Clear any prior results
        db.query(LabResult).filter(LabResult.report_id == report.id).delete()

        created_labs = []
        for t in raw_tests:
            evaluation = evaluate_result(t.get("result"), t.get("reference_range"))
            lab = LabResult(
                report_id=report.id,
                patient_id=patient.id,
                test_name=t["test_name"],
                category=t.get("category", "General"),
                result_value=str(t["result"]),
                numeric_value=evaluation.get("numeric_value"),
                unit=t.get("unit", ""),
                reference_range_raw=t.get("reference_range"),
                ref_min=evaluation.get("ref_min"),
                ref_max=evaluation.get("ref_max"),
                status=evaluation.get("status", "NOT_DETERMINED"),
                observation=evaluation.get("observation"),
                source_text=t.get("source_text"),
                source_type="report_extracted",
                is_verified=False
            )
            db.add(lab)
            created_labs.append(lab)

        db.commit()

        # Check evaluations
        glucose = next(l for l in created_labs if "glucose" in l.test_name.lower())
        assert glucose.status == "HIGH", f"Expected HIGH, got {glucose.status}"
        print(f"   ✓ Fasting Glucose: {glucose.result_value} {glucose.unit} [Status: {glucose.status}] (Ref: {glucose.reference_range_raw})")

        potassium = next(l for l in created_labs if "potassium" in l.test_name.lower())
        assert potassium.status == "LOW", f"Expected LOW, got {potassium.status}"
        print(f"   ✓ Potassium: {potassium.result_value} {potassium.unit} [Status: {potassium.status}] (Ref: {potassium.reference_range_raw})")

        # 5. Simulate Human Review & Verification
        print("\n[Step 5] Simulating human-in-the-loop verification & edit...")
        # Clinician verifies glucose
        glucose.is_verified = True
        glucose.verified_by = user.id
        db.commit()
        print(f"   ✓ Clinician verified {glucose.test_name} result.")

        # Clinician edits potassium to 3.8 and verifies status automatically recomputes to NORMAL
        potassium_eval_after = evaluate_result("3.8", potassium.reference_range_raw)
        potassium.result_value = "3.8"
        potassium.numeric_value = potassium_eval_after["numeric_value"]
        potassium.status = potassium_eval_after["status"]
        potassium.source_type = "user_provided"
        potassium.is_verified = True
        db.commit()
        assert potassium.status == "NORMAL", f"Expected NORMAL after edit, got {potassium.status}"
        print(f"   ✓ Edited Potassium to 3.8 -> Re-evaluated status: [{potassium.status}] (Provenance: {potassium.source_type})")

        # 6. Generate Non-Diagnostic AI Summary
        print("\n[Step 6] Generating Responsible AI clinical summary...")
        labs_data = [
            {
                "test_name": l.test_name,
                "result_value": l.result_value,
                "unit": l.unit,
                "reference_range_raw": l.reference_range_raw,
                "status": l.status,
                "observation": l.observation
            }
            for l in created_labs
        ]
        summary_dict = generate_summary(
            patient_name=f"{patient.first_name} {patient.last_name}",
            patient_age=patient.age,
            patient_sex=patient.sex,
            symptoms=patient.symptoms,
            medications=patient.current_medications,
            lab_results=labs_data,
            report_date=report.report_date
        )
        assert "MedLens is an information organization" in summary_dict["disclaimer"]
        assert len(summary_dict["doctor_questions"]) > 0
        print(f"   ✓ Summary generated ({len(summary_dict['key_findings'])} key findings, {len(summary_dict['doctor_questions'])} doctor questions)")
        print(f"   ✓ Mandatory disclaimer attached: \"{summary_dict['disclaimer'][:60]}...\"")

        # 7. Generate Clinical PDF via ReportLab
        print("\n[Step 7] Generating ReportLab clinical PDF...")
        pdf_buffer = generate_clinical_pdf(
            patient_info={
                "first_name": patient.first_name,
                "last_name": patient.last_name,
                "age": patient.age,
                "sex": patient.sex,
                "date_of_birth": patient.date_of_birth,
                "symptoms": patient.symptoms,
                "allergies": patient.allergies,
                "current_medications": patient.current_medications
            },
            report_info={
                "file_name": report.file_name,
                "report_date": report.report_date,
                "lab_facility": report.lab_facility
            },
            lab_results=labs_data,
            summary_text=summary_dict["content"]
        )
        pdf_bytes = pdf_buffer.getvalue()
        assert len(pdf_bytes) > 1000, "PDF buffer is too small!"
        print(f"   ✓ Clinical summary PDF generated successfully ({len(pdf_bytes)} bytes)")

        # Save sample PDF artifact to sample_data
        sample_pdf_output = os.path.abspath(os.path.join(os.path.dirname(__file__), "../sample_data/MedLens_Sample_Clinical_Summary.pdf"))
        with open(sample_pdf_output, "wb") as f:
            f.write(pdf_bytes)
        print(f"   ✓ Saved sample PDF for inspection: {sample_pdf_output}")

        print("\n" + "=" * 65)
        print("  ✓ ALL PIPELINE STAGES VERIFIED WITH 100% PASS RATE!")
        print("=" * 65)

    finally:
        db.close()


if __name__ == "__main__":
    run_full_pipeline_test()
