"""
MedLens Deterministic Reference Range Evaluation Engine
-------------------------------------------------------
STRICT MEDICAL SAFETY RULES:
1. ONLY evaluate a result when the source report provides an explicit reference range.
2. NEVER use hardcoded external medical standards or invent reference ranges.
3. If reference range is missing -> "UNKNOWN" (Display: "Reference range not provided in source report.")
4. If reference range is ambiguous -> "NOT ASSESSABLE" / "NEEDS_VERIFICATION".
5. Numeric evaluations:
   - val < min           -> "LOW"
   - min <= val <= max   -> "NORMAL"
   - val > max           -> "HIGH"
6. Categorical results (do NOT force into LOW/NORMAL/HIGH):
   - "POSITIVE", "NEGATIVE", "REACTIVE", "NON-REACTIVE", "DETECTED", "NOT DETECTED", "REPORTED".
"""

import re
from typing import Optional, Tuple, Dict, Any

CATEGORICAL_MAP = {
    "positive": "POSITIVE",
    "negative": "NEGATIVE",
    "reactive": "REACTIVE",
    "non-reactive": "NON-REACTIVE",
    "nonreactive": "NON-REACTIVE",
    "detected": "DETECTED",
    "not detected": "NOT DETECTED",
    "not-detected": "NOT DETECTED",
    "normal": "NORMAL",
    "abnormal": "REPORTED"
}


def extract_numeric(val_str: Optional[str]) -> Optional[float]:
    """Safely extracts the first float value from a string."""
    if not val_str:
        return None
    val_clean = str(val_str).strip().replace(',', '')
    match = re.search(r"[-+]?\d*\.?\d+", val_clean)
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return None
    return None


def parse_reference_range(raw_range: Optional[str]) -> Tuple[Optional[float], Optional[float], str]:
    """
    Parses a reference range string into (min_val, max_val, classification).
    Classification: "NUMERIC_RANGE", "ONE_SIDED_MAX", "ONE_SIDED_MIN", "MISSING", "AMBIGUOUS", "CATEGORICAL"
    """
    if not raw_range:
        return None, None, "MISSING"

    cleaned = str(raw_range).strip()
    lower_str = cleaned.lower()

    # Detect explicitly missing indicators
    missing_keywords = [
        "not specified", "none", "n/a", "not provided", "missing", 
        "unspecified", "null", "not available", "unknown"
    ]
    if any(k in lower_str for k in missing_keywords):
        return None, None, "MISSING"

    # Detect ambiguous / qualitative indicators
    ambiguous_keywords = [
        "see note", "pending", "ambiguous", "variable", 
        "refer to note", "interpret", "cannot assess"
    ]
    if any(k in lower_str for k in ambiguous_keywords):
        return None, None, "AMBIGUOUS"

    # Check for categorical reference benchmarks (e.g. Negative, Non-reactive)
    for cat_key, cat_val in CATEGORICAL_MAP.items():
        if cat_key in lower_str:
            return None, None, f"CATEGORICAL:{cat_val}"

    # Clean brackets and standard prefixes
    cleaned_range = re.sub(r"[\[\]\(\)]", "", cleaned).strip()

    # Check for two-sided interval: e.g. "70 - 99", "70.0 to 99.0", "12.0-16.0"
    interval_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)", cleaned_range, re.IGNORECASE)
    if interval_match:
        try:
            r_min = float(interval_match.group(1))
            r_max = float(interval_match.group(2))
            return r_min, r_max, "NUMERIC_RANGE"
        except ValueError:
            pass

    # Check for upper limit only: e.g. "< 200", "<= 100", "less than 150"
    max_match = re.search(r"(?:<|<=|less\s+than)\s*(\d+(?:\.\d+)?)", cleaned_range, re.IGNORECASE)
    if max_match:
        try:
            r_max = float(max_match.group(1))
            return None, r_max, "ONE_SIDED_MAX"
        except ValueError:
            pass

    # Check for lower limit only: e.g. "> 50", ">= 60", "greater than 40"
    min_match = re.search(r"(?:>|>=|greater\s+than)\s*(\d+(?:\.\d+)?)", cleaned_range, re.IGNORECASE)
    if min_match:
        try:
            r_min = float(min_match.group(1))
            return r_min, None, "ONE_SIDED_MIN"
        except ValueError:
            pass

    # Check if there are any numbers at all
    any_numbers = re.findall(r"\d+(?:\.\d+)?", cleaned_range)
    if not any_numbers:
        return None, None, "AMBIGUOUS"

    return None, None, "AMBIGUOUS"


def evaluate_result(result_value: Any, reference_range_raw: Optional[str]) -> Dict[str, Any]:
    """
    Deterministically evaluates a lab result against its source reference range.
    Returns:
      {
        "status": "LOW" | "NORMAL" | "HIGH" | "UNKNOWN" | "NOT_ASSESSABLE" | Categorical string,
        "numeric_value": float or None,
        "reference_low": float or None,
        "reference_high": float or None,
        "observation": str,
        "needs_verification": bool
      }
    """
    res_str = str(result_value).strip().lower()

    # 1. Check for categorical values in result first (e.g. "Negative", "Non-Reactive", "Detected")
    for cat_key, cat_val in CATEGORICAL_MAP.items():
        if cat_key in res_str:
            # Categorical test result detected: do NOT force into LOW/NORMAL/HIGH!
            return {
                "status": cat_val,
                "numeric_value": None,
                "reference_low": None,
                "reference_high": None,
                "observation": f"Categorical analyte recorded as {cat_val}.",
                "needs_verification": False
            }

    ref_min, ref_max, range_type = parse_reference_range(reference_range_raw)
    num_val = extract_numeric(result_value)

    # 2. Missing reference range
    if range_type == "MISSING":
        return {
            "status": "UNKNOWN",
            "numeric_value": num_val,
            "reference_low": None,
            "reference_high": None,
            "observation": "Reference range not provided in source report.",
            "needs_verification": True
        }

    # 3. Ambiguous reference range
    if range_type == "AMBIGUOUS":
        return {
            "status": "NOT ASSESSABLE",
            "numeric_value": num_val,
            "reference_low": None,
            "reference_high": None,
            "observation": "Source reference range is ambiguous or requires clinical interpretation notes.",
            "needs_verification": True
        }

    # 4. Categorical expected benchmark (e.g. Reference is "Negative")
    if range_type.startswith("CATEGORICAL:"):
        expected_cat = range_type.split(":", 1)[1]
        if res_str == expected_cat.lower():
            return {
                "status": expected_cat,
                "numeric_value": None,
                "reference_low": None,
                "reference_high": None,
                "observation": f"Result matches expected baseline ({expected_cat}).",
                "needs_verification": False
            }
        else:
            return {
                "status": "REPORTED",
                "numeric_value": None,
                "reference_low": None,
                "reference_high": None,
                "observation": f"Qualitative result '{result_value}' reported against expected '{expected_cat}'.",
                "needs_verification": True
            }

    # If range is numeric but result is non-numeric
    if num_val is None:
        return {
            "status": "NOT ASSESSABLE",
            "numeric_value": None,
            "reference_low": ref_min,
            "reference_high": ref_max,
            "observation": f"Result value '{result_value}' is non-numeric.",
            "needs_verification": True
        }

    # 5. Standard interval [ref_min, ref_max]
    if range_type == "NUMERIC_RANGE" and ref_min is not None and ref_max is not None:
        if num_val < ref_min:
            return {
                "status": "LOW",
                "numeric_value": num_val,
                "reference_low": ref_min,
                "reference_high": ref_max,
                "observation": f"Value {num_val} is below source reference range ({ref_min} - {ref_max}).",
                "needs_verification": False
            }
        elif num_val > ref_max:
            return {
                "status": "HIGH",
                "numeric_value": num_val,
                "reference_low": ref_min,
                "reference_high": ref_max,
                "observation": f"Value {num_val} is above source reference range ({ref_min} - {ref_max}).",
                "needs_verification": False
            }
        else:
            return {
                "status": "NORMAL",
                "numeric_value": num_val,
                "reference_low": ref_min,
                "reference_high": ref_max,
                "observation": f"Value {num_val} is within source reference range ({ref_min} - {ref_max}).",
                "needs_verification": False
            }

    # 6. One-sided upper bound (< ref_max)
    if range_type == "ONE_SIDED_MAX" and ref_max is not None:
        if num_val > ref_max:
            return {
                "status": "HIGH",
                "numeric_value": num_val,
                "reference_low": None,
                "reference_high": ref_max,
                "observation": f"Value {num_val} exceeds upper threshold (< {ref_max}).",
                "needs_verification": False
            }
        else:
            return {
                "status": "NORMAL",
                "numeric_value": num_val,
                "reference_low": None,
                "reference_high": ref_max,
                "observation": f"Value {num_val} satisfies threshold (< {ref_max}).",
                "needs_verification": False
            }

    # 7. One-sided lower bound (> ref_min)
    if range_type == "ONE_SIDED_MIN" and ref_min is not None:
        if num_val < ref_min:
            return {
                "status": "LOW",
                "numeric_value": num_val,
                "reference_low": ref_min,
                "reference_high": None,
                "observation": f"Value {num_val} is below minimum threshold (> {ref_min}).",
                "needs_verification": False
            }
        else:
            return {
                "status": "NORMAL",
                "numeric_value": num_val,
                "reference_low": ref_min,
                "reference_high": None,
                "observation": f"Value {num_val} satisfies threshold (> {ref_min}).",
                "needs_verification": False
            }

    return {
        "status": "UNKNOWN",
        "numeric_value": num_val,
        "reference_low": ref_min,
        "reference_high": ref_max,
        "observation": "Reference range status could not be assessed.",
        "needs_verification": True
    }
