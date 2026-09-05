"""
Report Comparison & Biomarker Trend Analytics API
------------------------------------------------
GET /api/patients/{patient_id}/compare
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.database import get_db
from app.models import Patient, Report, LabResult

router = APIRouter(prefix="/api/patients", tags=["Comparison"])


@router.get("/{patient_id}/compare")
def compare_patient_reports(patient_id: int, db: Session = Depends(get_db)):
    """
    Compares consecutive reports for a patient.
    Outputs:
    1. Table comparison with deltas and status shifts.
    2. Time-series data points formatted directly for Recharts line charts.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    reports = (
        db.query(Report)
        .filter(Report.patient_id == patient_id, Report.status == "completed")
        .order_by(Report.created_at.asc())
        .all()
    )

    if len(reports) < 2:
        # If only 1 report exists, still return its results so UI can display single point baseline
        if len(reports) == 1:
            single_rep = reports[0]
            items = []
            for r in single_rep.lab_results:
                items.append({
                    "test_name": r.test_name,
                    "unit": r.unit,
                    "previous_value": None,
                    "current_value": r.result_value,
                    "numeric_current": r.numeric_value,
                    "reference_range": r.reference_range_raw,
                    "current_status": r.status,
                    "change": "Baseline",
                    "delta": None
                })
            return {
                "has_comparison": False,
                "message": "Only one report available. Displaying baseline values.",
                "previous_report_date": None,
                "current_report_date": single_rep.report_date or "Current",
                "comparisons": items,
                "chart_trends": []
            }

        return {
            "has_comparison": False,
            "message": "No completed reports available for comparison.",
            "comparisons": [],
            "chart_trends": []
        }

    # Compare the last two reports
    prev_report = reports[-2]
    curr_report = reports[-1]

    prev_map = {r.test_name.lower().strip(): r for r in prev_report.lab_results}
    curr_map = {r.test_name.lower().strip(): r for r in curr_report.lab_results}

    all_tests = sorted(list(set(prev_map.keys()).union(set(curr_map.keys()))))
    comparison_table = []

    for key in all_tests:
        prev_lab = prev_map.get(key)
        curr_lab = curr_map.get(key)

        test_name = curr_lab.test_name if curr_lab else prev_lab.test_name
        unit = curr_lab.unit if curr_lab else prev_lab.unit
        ref_range = curr_lab.reference_range_raw if curr_lab else prev_lab.reference_range_raw

        prev_val = prev_lab.result_value if prev_lab else None
        curr_val = curr_lab.result_value if curr_lab else None

        delta = None
        direction = "Unchanged"

        if prev_lab and curr_lab and prev_lab.numeric_value is not None and curr_lab.numeric_value is not None:
            delta = round(curr_lab.numeric_value - prev_lab.numeric_value, 2)
            if delta > 0:
                direction = "Increased"
            elif delta < 0:
                direction = "Decreased"
            else:
                direction = "Stable"

        comparison_table.append({
            "test_name": test_name,
            "unit": unit,
            "reference_range": ref_range,
            "previous_value": prev_val,
            "current_value": curr_val,
            "previous_status": prev_lab.status if prev_lab else None,
            "current_status": curr_lab.status if curr_lab else None,
            "delta": delta,
            "direction": direction
        })

    # Prepare multi-point chart series for repeat tests across all reports
    chart_trends = []
    # Collect common repeat biomarkers
    common_keys = set.intersection(*[{r.test_name.lower().strip() for r in rep.lab_results} for rep in reports if rep.lab_results])
    
    for key in common_keys:
        series_points = []
        for rep in reports:
            matching = next((r for r in rep.lab_results if r.test_name.lower().strip() == key), None)
            if matching and matching.numeric_value is not None:
                series_points.append({
                    "date": rep.report_date or rep.created_at.strftime("%Y-%m-%d"),
                    "value": matching.numeric_value,
                    "unit": matching.unit,
                    "status": matching.status
                })
        if len(series_points) >= 2:
            first_match = next(r for r in reports[0].lab_results if r.test_name.lower().strip() == key)
            chart_trends.append({
                "test_name": first_match.test_name,
                "unit": first_match.unit,
                "data": series_points
            })

    return {
        "has_comparison": True,
        "previous_report_date": prev_report.report_date or "Previous",
        "current_report_date": curr_report.report_date or "Current",
        "comparisons": comparison_table,
        "chart_trends": chart_trends
    }
