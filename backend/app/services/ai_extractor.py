"""
MedLens AI Extraction Service
------------------------------
Extracts structured lab tests from unstructured medical report text.
Outputs structured JSON adhering to the MedLens lab result schema.
Supports:
1. Live OpenAI API extraction (when OPENAI_API_KEY is provided in .env)
2. High-fidelity heuristic/regex fallback parser (for offline hackathon demonstrations)
"""

import os
import re
import json
from typing import List, Dict, Any


EXTRACTION_SYSTEM_PROMPT = """
You are MedLens AI Extraction Assistant.
Your sole job is to extract laboratory test results from medical report text into a structured JSON format.

RULES:
1. Extract every individual lab test with:
   - test_name: Full clinical name of the test
   - result: The recorded value (as a string, e.g. "145", "13.8", "Negative")
   - unit: Unit of measurement (e.g. "mg/dL", "g/dL", "10^3/uL")
   - reference_range: The reference range written explicitly in the report (e.g. "70 - 99 mg/dL", "< 200"). If missing or not stated, output "Not Specified".
   - date: Date of test/collection if mentioned, otherwise null
   - observation: Any note or flag mentioned next to the test in the report
   - source_text: The exact verbatim snippet from the report where this test appears
   - category: High level category (e.g. "Hematology", "Metabolic Panel", "Lipid Panel", "General")
2. NEVER invent a reference range. If not in the source text, use "Not Specified".
3. DO NOT determine LOW, NORMAL, or HIGH. Only extract what is written.
4. Output MUST be valid JSON with a root object: {"tests": [...]}
"""


def extract_with_openai(raw_text: str, api_key: str) -> List[Dict[str, Any]]:
    """Calls OpenAI API to extract structured lab data."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": f"Extract all lab tests from this report text:\n\n{raw_text}"}
            ],
            temperature=0.0
        )
        
        content = response.choices[0].message.content
        parsed = json.loads(content)
        return parsed.get("tests", [])
    except Exception as e:
        print(f"[MedLens Extractor] OpenAI call failed ({e}); falling back to heuristic parser.")
        return fallback_regex_extractor(raw_text)


def fallback_regex_extractor(raw_text: str) -> List[Dict[str, Any]]:
    """
    Robust heuristic parser that extracts lab tests from standard clinical text reports
    (CBC, CMP, Lipid, Metabolic panels) without requiring an external API key.
    Ensures the application works reliably out-of-the-box for hackathon judging.
    """
    tests = []
    lines = raw_text.splitlines()

    # Determine current category context
    current_category = "General"
    category_patterns = [
        (r"COMPLETE BLOOD COUNT|CBC|HEMATOLOGY", "Hematology"),
        (r"COMPREHENSIVE METABOLIC|METABOLIC PANEL|CMP", "Metabolic Panel"),
        (r"LIPID|CHOLESTEROL|CARDIAC", "Lipid Panel"),
        (r"RENAL|KIDNEY", "Renal Function"),
        (r"LIVER|HEPATIC", "Hepatic Panel"),
    ]

    for line in lines:
        line_clean = line.strip()
        if not line_clean or line_clean.startswith("---") or line_clean.startswith("==="):
            continue

        # Check for category header
        matched_cat = False
        for pattern, cat_name in category_patterns:
            if re.search(pattern, line_clean, re.IGNORECASE):
                current_category = cat_name
                matched_cat = True
                break
        if matched_cat:
            continue

        # Skip administrative/demographic lines
        if any(keyword in line_clean.lower() for keyword in ["patient information", "collection date", "report date", "clia", "director", "specimen id", "ordering physician"]):
            continue

        # Match table line format:
        # e.g.: "Fasting Blood Glucose            145      HIGH    mg/dL       70 - 99"
        # e.g.: "Hemoglobin                       13.8             g/dL        12.0 - 16.0"
        # e.g.: "Total Cholesterol                218              mg/dL       < 200"
        # e.g.: "Triglycerides                    162              mg/dL       Not Specified"
        # e.g.: "C-Reactive Protein (hs-CRP)      1.4              mg/dL       See Note*"
        
        # Regex to capture: Name, Result, optional Flag, optional Unit, optional Reference Range
        table_pattern = re.compile(
            r"^([A-Za-z0-9\s\(\)\-\/\,\.]+?)\s{2,}"                # Test Name (followed by at least 2 spaces)
            r"([><]?\s*\d+(?:\.\d+)?|[A-Za-z]+)\s*"               # Result value
            r"(HIGH|LOW|ABNORMAL|CRITICAL)?\s*"                   # Optional flag
            r"([%a-zA-Z0-9\/\^\.\-]+)?\s*"                        # Optional unit
            r"((?:<|>|<=|>=)?\s*\d+(?:\.\d+)?(?:\s*(?:-|–|to)\s*\d+(?:\.\d+)?)?|Not Specified|See Note\*?|Ambiguous[^\n]*)?$",
            re.IGNORECASE
        )

        match = table_pattern.match(line_clean)
        if match:
            test_name = match.group(1).strip()
            # Ignore table header rows
            if test_name.lower() in ["test name", "test", "analyte", "component"]:
                continue

            result_val = match.group(2).strip()
            flag = match.group(3)
            unit_val = match.group(4) or ""
            ref_range = match.group(5) or "Not Specified"

            # Clean up unit if it captured a flag or reference artifact
            if unit_val.upper() in ["HIGH", "LOW", "NORMAL"]:
                unit_val = ""

            tests.append({
                "test_name": test_name,
                "result": result_val,
                "unit": unit_val.strip(),
                "reference_range": ref_range.strip(),
                "date": None,
                "observation": f"Source Flag: {flag}" if flag else "Reported",
                "source_text": line_clean,
                "category": current_category,
                "confidence_score": 0.95
            })

    return tests


def extract_lab_data(raw_text: str) -> List[Dict[str, Any]]:
    """
    Main extraction interface.
    Checks for OPENAI_API_KEY; uses OpenAI API if present, otherwise uses
    the deterministic fallback regex parser.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and api_key.startswith("sk-") and len(api_key) > 20:
        return extract_with_openai(raw_text, api_key)
    else:
        return fallback_regex_extractor(raw_text)
