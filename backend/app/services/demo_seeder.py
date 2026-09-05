"""
MedLens Synthetic Demo Data Seeder
----------------------------------
Populates synthetic test patients, reports, lab tests, and conflicts:
- Patient A: Sarah Jenkins (Hypertension, Normal CBC + Abnormal CMP with Glucose High, Age conflict)
- Patient B: Marcus Chen (Diabetes, Lipid panel with missing range for Triglycerides, Non-reactive test)
- NEVER uses real patient health information (PHI).
- All records marked: "SYNTHETIC DEMO DATA — NOT REAL PATIENT INFORMATION".
"""

from sqlalchemy.orm import Session
from app.models import User, Patient, Report, LabResult, Conflict, Summary, AuditLog
from app.core.security import hash_password
from app.services.range_evaluator import evaluate_result
from app.services.conflict_detector import detect_patient_conflicts


def seed_demo_data(db: Session):
    """Cleans previous demo data and seeds Patient A & Patient B with rich scenarios."""
    # Ensure demo clinician exists
    demo_user = db.query(User).filter_by(email="clinician@medlens.health").first()
    if not demo_user:
        demo_user = User(
            email="clinician@medlens.health",
            hashed_password=hash_password("DemoPassword123!"),
            full_name="Dr. Alex Rivera, MD",
            role="clinician"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

    # -------------------------------------------------------------
    # PATIENT A: Sarah Jenkins
    # -------------------------------------------------------------
    patient_a = db.query(Patient).filter_by(first_name="Sarah", last_name="Jenkins").first()
    if not patient_a:
        patient_a = Patient(
            user_id=demo_user.id,
            first_name="Sarah",
            last_name="Jenkins",
            age=45,
            sex="Female",
            date_of_birth="1981-06-14",
            contact_info="sarah.jenkins@synthetic-demo.net",
            symptoms="Intermittent fatigue, mild dizziness, frequent thirst",
            existing_conditions="Hypertension",
            allergies="Penicillin",
            current_medications="Lisinopril 10mg daily",
            previous_history="SYNTHETIC DEMO DATA — NOT REAL PATIENT INFORMATION. Annual checkup history normal.",
            other_info="Referred for metabolic checkup.",
            provenance_source="USER PROVIDED"
        )
        db.add(patient_a)
        db.commit()
        db.refresh(patient_a)

        # Report 1 (Previous): Complete Blood Count (CBC - Normal)
        cbc_text = """METROHEALTH DIAGNOSTIC LABORATORIES
PATIENT: Sarah Jenkins | Age: 45 | DOB: 1981-06-14 | Sex: Female
Collection Date: 2026-06-10 | Facility: MetroHealth Main Lab

TEST NAME                       RESULT    FLAG    UNITS       REFERENCE RANGE
-----------------------------------------------------------------------------
White Blood Cells (WBC)          6.4              10^3/uL     4.5 - 11.0
Red Blood Cells (RBC)            4.35             10^6/uL     4.00 - 5.20
Hemoglobin                       13.4             g/dL        12.0 - 16.0
Hematocrit                       40.5             %           37.0 - 47.0
Platelets                        245              10^3/uL     150 - 450"""

        rep_a1 = Report(
            patient_id=patient_a.id,
            file_name="sarah_jenkins_cbc_june2026.pdf",
            file_path="sample_data/sample_cbc_normal.txt",
            file_type="pdf",
            file_size=14200,
            report_date="2026-06-10",
            lab_facility="MetroHealth Diagnostic Laboratories",
            status="completed",
            raw_text=cbc_text
        )
        db.add(rep_a1)
        db.commit()
        db.refresh(rep_a1)

        # Labs for Report 1
        labs_a1 = [
            ("White Blood Cells (WBC)", "6.4", "10^3/uL", "4.5 - 11.0", "Hematology", 1),
            ("Red Blood Cells (RBC)", "4.35", "10^6/uL", "4.00 - 5.20", "Hematology", 1),
            ("Hemoglobin", "13.4", "g/dL", "12.0 - 16.0", "Hematology", 1),
            ("Hematocrit", "40.5", "%", "37.0 - 47.0", "Hematology", 1),
            ("Platelets", "245", "10^3/uL", "150 - 450", "Hematology", 1),
        ]
        for name, val, unit, r_range, cat, page in labs_a1:
            ev = evaluate_result(val, r_range)
            l = LabResult(
                report_id=rep_a1.id,
                patient_id=patient_a.id,
                test_name=name,
                category=cat,
                result_value=val,
                numeric_value=ev["numeric_value"],
                unit=unit,
                reference_range_raw=r_range,
                reference_low=ev["reference_low"],
                reference_high=ev["reference_high"],
                status=ev["status"],
                observation=ev["observation"],
                source="REPORT EXTRACTED -> USER VERIFIED",
                source_document=rep_a1.file_name,
                source_page=page,
                source_text=f"{name} {val} {unit} Ref: {r_range}",
                confidence_level="HIGH",
                confidence_score=0.98,
                is_verified=True,
                is_accepted=True
            )
            db.add(l)

        # Report 2 (Current): Comprehensive Metabolic Panel (CMP - Out of Range)
        # Intentionally has "Age: 47" to trigger CONFLICT DETECTION!
        cmp_text = """METROHEALTH DIAGNOSTIC LABORATORIES
PATIENT: Sarah Jenkins | Age: 47 | DOB: 1981-06-14 | Sex: Female
Collection Date: 2026-08-25 | Facility: MetroHealth South Clinic

TEST NAME                       RESULT    FLAG    UNITS       REFERENCE RANGE
-----------------------------------------------------------------------------
Fasting Blood Glucose            145      HIGH    mg/dL       70 - 99
Blood Urea Nitrogen (BUN)        17               mg/dL       7 - 20
Serum Creatinine                 0.9              mg/dL       0.6 - 1.2
Sodium                           139              mmol/L      136 - 145
Potassium                        3.2      LOW     mmol/L      3.5 - 5.1
Chloride                         101              mmol/L      98 - 107
Calcium                          9.3              mg/dL       8.6 - 10.2"""

        rep_a2 = Report(
            patient_id=patient_a.id,
            file_name="sarah_jenkins_cmp_aug2026.pdf",
            file_path="sample_data/sample_cmp_abnormal.txt",
            file_type="pdf",
            file_size=18400,
            report_date="2026-08-25",
            lab_facility="MetroHealth South Clinic",
            status="completed",
            raw_text=cmp_text
        )
        db.add(rep_a2)
        db.commit()
        db.refresh(rep_a2)

        labs_a2 = [
            ("Fasting Blood Glucose", "145", "mg/dL", "70 - 99", "Metabolic Panel", 1),
            ("Blood Urea Nitrogen (BUN)", "17", "mg/dL", "7 - 20", "Metabolic Panel", 1),
            ("Serum Creatinine", "0.9", "mg/dL", "0.6 - 1.2", "Metabolic Panel", 1),
            ("Sodium", "139", "mmol/L", "136 - 145", "Metabolic Panel", 1),
            ("Potassium", "3.2", "mmol/L", "3.5 - 5.1", "Metabolic Panel", 1),
            ("Chloride", "101", "mmol/L", "98 - 107", "Metabolic Panel", 1),
            ("Calcium", "9.3", "mg/dL", "8.6 - 10.2", "Metabolic Panel", 1),
        ]
        for name, val, unit, r_range, cat, page in labs_a2:
            ev = evaluate_result(val, r_range)
            l = LabResult(
                report_id=rep_a2.id,
                patient_id=patient_a.id,
                test_name=name,
                category=cat,
                result_value=val,
                numeric_value=ev["numeric_value"],
                unit=unit,
                reference_range_raw=r_range,
                reference_low=ev["reference_low"],
                reference_high=ev["reference_high"],
                status=ev["status"],
                observation=ev["observation"],
                source="REPORT EXTRACTED",
                source_document=rep_a2.file_name,
                source_page=page,
                source_text=f"{name} {val} {unit} Ref: {r_range}",
                confidence_level="HIGH",
                confidence_score=0.96,
                is_verified=False,
                is_accepted=True
            )
            db.add(l)

        # Detect conflicts (Will detect the Age 45 vs Age 47 discrepancy!)
        db.commit()
        detect_patient_conflicts(patient_a.id, db)

        # Non-diagnostic Summary for Patient A
        summ_a = Summary(
            patient_id=patient_a.id,
            report_id=rep_a2.id,
            content=(
                "The provided laboratory record from August 25, 2026 includes 7 metabolic tests. "
                "According strictly to the reference intervals provided on the source report, "
                "Fasting Blood Glucose is recorded above reference range (145 mg/dL vs. 70-99 mg/dL), "
                "and Potassium is recorded below reference range (3.2 mmol/L vs. 3.5-5.1 mmol/L). "
                "Remaining metabolic markers fall within reported intervals."
            ),
            key_findings=[
                {"test_name": "Fasting Blood Glucose", "status": "HIGH", "value": "145 mg/dL", "ref_range": "70 - 99 mg/dL", "explanation": "Value exceeds the source laboratory's reference range."},
                {"test_name": "Potassium", "status": "LOW", "value": "3.2 mmol/L", "ref_range": "3.5 - 5.1 mmol/L", "explanation": "Value is below the source laboratory's reference range."}
            ],
            doctor_questions=[
                "Would you recommend repeating fasting glucose or ordering an HbA1c test?",
                "Could the reported potassium level relate to my current blood pressure medication (Lisinopril)?",
                "Are there dietary or electrolyte guidelines I should discuss with you?"
            ],
            data_quality_notes="Notice: Source report lists patient age as 47, while user intake lists 45. A review conflict has been flagged for resolution.",
            missing_info_notes="HbA1c and lipid panel were not ordered on this date."
        )
        db.add(summ_a)
        db.commit()

    # -------------------------------------------------------------
    # PATIENT B: Marcus Chen
    # -------------------------------------------------------------
    patient_b = db.query(Patient).filter_by(first_name="Marcus", last_name="Chen").first()
    if not patient_b:
        patient_b = Patient(
            user_id=demo_user.id,
            first_name="Marcus",
            last_name="Chen",
            age=62,
            sex="Male",
            date_of_birth="1964-11-20",
            contact_info="marcus.chen@synthetic-demo.net",
            symptoms="Mild joint stiffness in mornings",
            existing_conditions="Type 2 Diabetes, Dyslipidemia",
            allergies="Sulfa drugs",
            current_medications="Metformin 500mg BID",
            previous_history="SYNTHETIC DEMO DATA — NOT REAL PATIENT INFORMATION. Managed diabetes for 4 years.",
            other_info="Annual lipid & virology screening.",
            provenance_source="USER PROVIDED"
        )
        db.add(patient_b)
        db.commit()
        db.refresh(patient_b)

        lipid_text = """METROHEALTH DIAGNOSTIC LABORATORIES
PATIENT: Marcus Chen | Age: 62 | DOB: 1964-11-20 | Sex: Male
Collection Date: 2026-08-30 | Facility: MetroHealth Advanced Diagnostics

TEST NAME                       RESULT    FLAG    UNITS       REFERENCE RANGE
-----------------------------------------------------------------------------
Total Cholesterol                218              mg/dL       < 200
HDL Cholesterol                  52               mg/dL       > 50
LDL Cholesterol (Calc)           136              mg/dL       < 100
Triglycerides                    162              mg/dL       Not Specified
Hepatitis B Surface Antigen      Non-Reactive                 Non-Reactive
Serum Ferritin                   22               ng/mL       See Note*"""

        rep_b1 = Report(
            patient_id=patient_b.id,
            file_name="marcus_chen_lipid_aug2026.pdf",
            file_path="sample_data/sample_lipid_ambiguous.txt",
            file_type="pdf",
            file_size=16800,
            report_date="2026-08-30",
            lab_facility="MetroHealth Advanced Diagnostics",
            status="completed",
            raw_text=lipid_text
        )
        db.add(rep_b1)
        db.commit()
        db.refresh(rep_b1)

        labs_b1 = [
            ("Total Cholesterol", "218", "mg/dL", "< 200", "Lipid Panel", 1),
            ("HDL Cholesterol", "52", "mg/dL", "> 50", "Lipid Panel", 1),
            ("LDL Cholesterol (Calc)", "136", "mg/dL", "< 100", "Lipid Panel", 1),
            ("Triglycerides", "162", "mg/dL", "Not Specified", "Lipid Panel", 1),
            ("Hepatitis B Surface Antigen", "Non-Reactive", "", "Non-Reactive", "Serology", 1),
            ("Serum Ferritin", "22", "ng/mL", "See Note*", "Specialty", 1),
        ]
        for name, val, unit, r_range, cat, page in labs_b1:
            ev = evaluate_result(val, r_range)
            l = LabResult(
                report_id=rep_b1.id,
                patient_id=patient_b.id,
                test_name=name,
                category=cat,
                result_value=val,
                numeric_value=ev["numeric_value"],
                unit=unit,
                reference_range_raw=r_range,
                reference_low=ev["reference_low"],
                reference_high=ev["reference_high"],
                status=ev["status"],
                observation=ev["observation"],
                source="REPORT EXTRACTED",
                source_document=rep_b1.file_name,
                source_page=page,
                source_text=f"{name} {val} {unit} Ref: {r_range}",
                confidence_level="HIGH" if name != "Serum Ferritin" else "MEDIUM",
                confidence_score=0.97 if name != "Serum Ferritin" else 0.72,
                is_verified=False,
                is_accepted=True
            )
            db.add(l)

        db.commit()

        # Summary for Patient B
        summ_b = Summary(
            patient_id=patient_b.id,
            report_id=rep_b1.id,
            content=(
                "The laboratory report from August 30, 2026 reflects lipid and serology tests. "
                "Total Cholesterol and LDL Cholesterol are recorded above the source laboratory's thresholds. "
                "Triglycerides were recorded at 162 mg/dL, but no reference range was provided in the report, "
                "so reference status cannot be assessed. Hepatitis B screening was reported as Non-Reactive."
            ),
            key_findings=[
                {"test_name": "Total Cholesterol", "status": "HIGH", "value": "218 mg/dL", "ref_range": "< 200 mg/dL", "explanation": "Exceeds upper limit threshold (< 200)."},
                {"test_name": "Triglycerides", "status": "UNKNOWN", "value": "162 mg/dL", "ref_range": "Not Specified", "explanation": "Reference range not provided in source report."}
            ],
            doctor_questions=[
                "What is your target recommendation for my LDL cholesterol level?",
                "Should we re-evaluate triglycerides with a full fasting lipid re-test?",
                "Does my current Metformin regimen require any adjustments based on these numbers?"
            ],
            data_quality_notes="Triglyceride status is marked UNKNOWN because no reference interval was printed on the source report.",
            missing_info_notes="Reference range for Triglycerides not stated in document."
        )
        db.add(summ_b)
        db.commit()

    return {"status": "success", "message": "Demo data successfully seeded for Patient A (Sarah Jenkins) and Patient B (Marcus Chen)."}
