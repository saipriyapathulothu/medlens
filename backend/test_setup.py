"""
MedLens Phase 1 Verification Test
---------------------------------
Verifies:
1. SQLite connection works
2. All 6 tables are created correctly
3. Synthetic patient and test record can be inserted and queried
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal, init_db
from app.models import User, Patient, Report, LabResult, Summary, AuditLog


def run_verification():
    print("Testing MedLens Phase 1 Foundation...")
    print("-" * 50)

    # 1. Initialize Tables
    print("1. Creating database tables in SQLite...")
    init_db()

    db = SessionLocal()
    try:
        # Check if tables exist
        from sqlalchemy import inspect
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        print(f"   ✓ Tables created: {table_names}")

        expected_tables = ["users", "patients", "reports", "lab_results", "summaries", "audit_logs"]
        for table in expected_tables:
            assert table in table_names, f"Missing table: {table}"
        print("   ✓ All 6 expected tables verified!")

        # 2. Test Synthetic Data Insertion
        print("\n2. Inserting synthetic verification record...")
        test_user = db.query(User).filter_by(email="demo@medlens.health").first()
        if not test_user:
            test_user = User(
                email="demo@medlens.health",
                hashed_password="mock_hashed_password_for_phase_1",
                full_name="Dr. Alex Rivera",
                role="clinician"
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        print(f"   ✓ User record ready: ID {test_user.id} ({test_user.email})")

        test_patient = db.query(Patient).filter_by(first_name="Jane", last_name="Doe").first()
        if not test_patient:
            test_patient = Patient(
                user_id=test_user.id,
                first_name="Jane",
                last_name="Doe",
                age=38,
                sex="Female",
                date_of_birth="1988-04-12",
                symptoms="Fatigue, mild dizziness upon standing",
                existing_conditions="None reported",
                allergies="Penicillin",
                current_medications="Vitamin D3 2000 IU daily",
                other_info="Routine annual checkup"
            )
            db.add(test_patient)
            db.commit()
            db.refresh(test_patient)
        print(f"   ✓ Synthetic Patient created: ID {test_patient.id} ({test_patient.first_name} {test_patient.last_name})")

        test_report = db.query(Report).filter_by(patient_id=test_patient.id).first()
        if not test_report:
            test_report = Report(
                patient_id=test_patient.id,
                file_name="synthetic_cbc_panel_2026.pdf",
                file_path="sample_data/synthetic_cbc_panel_2026.pdf",
                file_type="pdf",
                report_date="2026-08-15",
                lab_facility="MetroHealth Diagnostic Laboratories",
                status="completed",
                raw_text="Hemoglobin: 13.8 g/dL (Ref: 12.0 - 16.0 g/dL)"
            )
            db.add(test_report)
            db.commit()
            db.refresh(test_report)
        print(f"   ✓ Synthetic Report recorded: ID {test_report.id} ({test_report.file_name})")

        # Test LabResult with deterministic reference range
        test_lab = db.query(LabResult).filter_by(report_id=test_report.id).first()
        if not test_lab:
            test_lab = LabResult(
                report_id=test_report.id,
                patient_id=test_patient.id,
                test_name="Hemoglobin",
                category="Hematology",
                result_value="13.8",
                numeric_value=13.8,
                unit="g/dL",
                reference_range_raw="12.0 - 16.0 g/dL",
                ref_min=12.0,
                ref_max=16.0,
                status="NORMAL",
                observation="Within normal reference range",
                source_text="Hemoglobin: 13.8 g/dL (Ref: 12.0 - 16.0 g/dL)",
                source_type="report_extracted",
                is_verified=True
            )
            db.add(test_lab)
            db.commit()
            db.refresh(test_lab)
        print(f"   ✓ Lab Result saved: {test_lab.test_name} = {test_lab.result_value} {test_lab.unit} [{test_lab.status}]")

        print("\n" + "=" * 50)
        print("✓ PHASE 1 BACKEND & DATABASE FOUNDATION VERIFIED!")
        print("=" * 50)

    except Exception as e:
        print(f"\n[ERROR] Verification failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_verification()
