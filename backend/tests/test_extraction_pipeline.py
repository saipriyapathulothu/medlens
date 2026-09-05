"""
End-to-End Extraction & Reference Range Pipeline Verification
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.ai_extractor import extract_lab_data
from app.services.range_evaluator import evaluate_result


def test_cmp_pipeline():
    sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample_data/sample_cmp_abnormal.txt"))
    with open(sample_path, "r", encoding="utf-8") as f:
        text = f.read()

    extracted_tests = extract_lab_data(text)
    print(f"\nExtracted {len(extracted_tests)} tests from CMP sample:")

    evaluated_results = []
    for test in extracted_tests:
        evaluation = evaluate_result(test["result"], test["reference_range"])
        evaluated_results.append({
            "test_name": test["test_name"],
            "result": test["result"],
            "unit": test["unit"],
            "ref_range": test["reference_range"],
            "status": evaluation["status"]
        })
        print(f" - {test['test_name']}: {test['result']} {test['unit']} (Ref: {test['reference_range']}) => [{evaluation['status']}]")

    # Verification assertions:
    glucose = next(t for t in evaluated_results if "glucose" in t["test_name"].lower())
    assert glucose["status"] == "HIGH", f"Expected HIGH for glucose, got {glucose['status']}"

    potassium = next(t for t in evaluated_results if "potassium" in t["test_name"].lower())
    assert potassium["status"] == "LOW", f"Expected LOW for potassium, got {potassium['status']}"

    sodium = next(t for t in evaluated_results if "sodium" in t["test_name"].lower())
    assert sodium["status"] == "NORMAL", f"Expected NORMAL for sodium, got {sodium['status']}"

    print("✓ CMP Pipeline test passed!")


def test_lipid_ambiguous_pipeline():
    sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample_data/sample_lipid_ambiguous.txt"))
    with open(sample_path, "r", encoding="utf-8") as f:
        text = f.read()

    extracted_tests = extract_lab_data(text)
    print(f"\nExtracted {len(extracted_tests)} tests from Lipid/Ambiguous sample:")

    evaluated_results = []
    for test in extracted_tests:
        evaluation = evaluate_result(test["result"], test["reference_range"])
        evaluated_results.append({
            "test_name": test["test_name"],
            "status": evaluation["status"],
            "needs_verification": evaluation["needs_verification"]
        })
        print(f" - {test['test_name']}: Ref: {test['reference_range']} => [{evaluation['status']}]")

    # Triglycerides was "Not Specified" in source report -> MUST be NOT_DETERMINED
    trig = next(t for t in evaluated_results if "triglycerides" in t["test_name"].lower())
    assert trig["status"] == "NOT_DETERMINED", f"Expected NOT_DETERMINED for triglycerides, got {trig['status']}"
    assert trig["needs_verification"] is True

    # hs-CRP was "See Note*" -> MUST be NEEDS_VERIFICATION
    crp = next(t for t in evaluated_results if "crp" in t["test_name"].lower())
    assert crp["status"] == "NEEDS_VERIFICATION", f"Expected NEEDS_VERIFICATION for CRP, got {crp['status']}"
    assert crp["needs_verification"] is True

    print("✓ Lipid / Ambiguous Pipeline test passed!")


if __name__ == "__main__":
    test_cmp_pipeline()
    test_lipid_ambiguous_pipeline()
    print("\n✓ ALL EXTRACTION & RANGE EVALUATION PIPELINE TESTS PASSED!")
