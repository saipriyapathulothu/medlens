"""
Unit Tests for MedLens Deterministic Reference Range Evaluator
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.range_evaluator import evaluate_result, parse_reference_range


def test_standard_interval_normal():
    res = evaluate_result("13.8", "12.0 - 16.0 g/dL")
    assert res["status"] == "NORMAL"
    assert res["numeric_value"] == 13.8
    assert res["ref_min"] == 12.0
    assert res["ref_max"] == 16.0
    assert not res["needs_verification"]


def test_standard_interval_high():
    res = evaluate_result("145", "70 - 99 mg/dL")
    assert res["status"] == "HIGH"
    assert res["numeric_value"] == 145.0
    assert res["ref_min"] == 70.0
    assert res["ref_max"] == 99.0
    assert not res["needs_verification"]


def test_standard_interval_low():
    res = evaluate_result("3.2", "3.5 - 5.1 mmol/L")
    assert res["status"] == "LOW"
    assert res["numeric_value"] == 3.2
    assert res["ref_min"] == 3.5
    assert res["ref_max"] == 5.1
    assert not res["needs_verification"]


def test_one_sided_max_normal():
    res = evaluate_result("150", "< 200 mg/dL")
    assert res["status"] == "NORMAL"
    assert res["numeric_value"] == 150.0
    assert res["ref_max"] == 200.0


def test_one_sided_max_high():
    res = evaluate_result("218", "< 200 mg/dL")
    assert res["status"] == "HIGH"
    assert res["numeric_value"] == 218.0
    assert res["ref_max"] == 200.0


def test_one_sided_min_normal():
    res = evaluate_result("54", "> 50 mg/dL")
    assert res["status"] == "NORMAL"
    assert res["numeric_value"] == 54.0
    assert res["ref_min"] == 50.0


def test_one_sided_min_low():
    res = evaluate_result("42", "> 50 mg/dL")
    assert res["status"] == "LOW"
    assert res["numeric_value"] == 42.0
    assert res["ref_min"] == 50.0


def test_missing_reference_range():
    # Strict rule: never invent range when source does not provide one
    res = evaluate_result("162", "Not Specified")
    assert res["status"] == "NOT_DETERMINED"
    assert res["needs_verification"] is True

    res2 = evaluate_result("162", "")
    assert res2["status"] == "NOT_DETERMINED"
    assert res2["needs_verification"] is True


def test_ambiguous_reference_range():
    res = evaluate_result("1.4", "See Note*")
    assert res["status"] == "NEEDS_VERIFICATION"
    assert res["needs_verification"] is True

    res2 = evaluate_result("22", "Ambiguous / Pending")
    assert res2["status"] == "NEEDS_VERIFICATION"
    assert res2["needs_verification"] is True


def test_qualitative_result():
    res = evaluate_result("Negative", "Negative")
    assert res["status"] == "NORMAL"
    assert not res["needs_verification"]

    res_abnormal = evaluate_result("Positive", "Negative")
    assert res_abnormal["status"] == "NEEDS_VERIFICATION"
    assert res_abnormal["needs_verification"] is True


if __name__ == "__main__":
    print("Running MedLens Reference Range Evaluator Test Suite...")
    test_standard_interval_normal()
    test_standard_interval_high()
    test_standard_interval_low()
    test_one_sided_max_normal()
    test_one_sided_max_high()
    test_one_sided_min_normal()
    test_one_sided_min_low()
    test_missing_reference_range()
    test_ambiguous_reference_range()
    test_qualitative_result()
    print("✓ All 10 Reference Range test scenarios passed with 100% precision!")
