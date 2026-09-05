"""
MedLens Responsible AI Summary Generator
----------------------------------------
Generates patient-friendly, non-diagnostic clinical summaries.

STRICT MEDICAL GUARDRAILS:
1. The AI must NOT diagnose diseases.
2. The AI must NOT prescribe medication.
3. The AI must NOT recommend dosage changes.
4. The AI must NOT present uncertain information as medical fact.
5. The permanent disclaimer must always be attached.
"""

import os
import json
from typing import Dict, Any, List

MANDATORY_DISCLAIMER = (
    "MedLens is an information organization and summarization tool. "
    "It does not provide medical diagnosis, prescribe medication, "
    "recommend dosage changes, or replace professional medical advice."
)


def generate_summary(
    patient_name: str,
    patient_age: Any,
    patient_sex: Any,
    symptoms: str,
    medications: str,
    lab_results: List[Dict[str, Any]],
    report_date: str = "Recent"
) -> Dict[str, Any]:
    """
    Generates a structured, responsible clinical summary.
    Works with OpenAI API if available; otherwise uses a robust template engine.
    """
    # Categorize lab findings based strictly on deterministic evaluation
    high_tests = [t for t in lab_results if t.get("status") == "HIGH"]
    low_tests = [t for t in lab_results if t.get("status") == "LOW"]
    normal_tests = [t for t in lab_results if t.get("status") == "NORMAL"]
    undetermined_tests = [t for t in lab_results if t.get("status") in ["NOT_DETERMINED", "NEEDS_VERIFICATION"]]

    total_tests = len(lab_results)
    abnormal_count = len(high_tests) + len(low_tests)

    # If OpenAI API Key is provided, call LLM with strict guardrails
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and api_key.startswith("sk-") and len(api_key) > 20:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)

            prompt = f"""
You are the MedLens Clinical Information Intelligence Assistant.
Create a patient-friendly, plain-language summary of this laboratory report.

PATIENT CONTEXT:
Name: {patient_name}
Age/Sex: {patient_age} / {patient_sex}
Reported Symptoms: {symptoms or 'None reported'}
Current Medications: {medications or 'None reported'}

LAB RESULTS:
Total Tests: {total_tests}
Above Reference Range: {[f"{t['test_name']}: {t['result_value']} {t['unit']} (Ref: {t['reference_range_raw']})" for t in high_tests]}
Below Reference Range: {[f"{t['test_name']}: {t['result_value']} {t['unit']} (Ref: {t['reference_range_raw']})" for t in low_tests]}
Normal Range: {len(normal_tests)} tests
Awaiting Verification / No Range: {len(undetermined_tests)} tests

STRICT NEGATIVE CONSTRAINTS:
1. Do NOT diagnose any medical condition or disease.
2. Do NOT prescribe any medication or treatment.
3. Do NOT suggest changing drug dosages.
4. Explain what the out-of-range biomarkers generally measure in simple everyday words.
5. Provide 3-5 specific questions the patient can ask their physician.

Return valid JSON:
{{
  "overview": "...",
  "key_findings": [
    {{"test_name": "...", "status": "...", "explanation": "..."}}
  ],
  "doctor_questions": ["Question 1", "Question 2", "Question 3"]
}}
"""
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            data = json.loads(resp.choices[0].message.content)

            return {
                "content": data.get("overview", "Laboratory report summary generated."),
                "key_findings": data.get("key_findings", []),
                "doctor_questions": data.get("doctor_questions", []),
                "disclaimer": MANDATORY_DISCLAIMER
            }
        except Exception as e:
            print(f"[Summary Generator] OpenAI failed ({e}); using deterministic fallback.")

    # High-fidelity deterministic fallback engine (offline hackathon mode)
    overview = (
        f"This report summary covers {total_tests} laboratory tests collected on {report_date}. "
        f"Based strictly on the reference intervals provided by the laboratory, {len(normal_tests)} tests "
        f"fall within expected ranges, while {abnormal_count} parameter(s) were flagged outside reference limits."
    )

    key_findings = []
    for t in high_tests:
        key_findings.append({
            "test_name": t.get("test_name"),
            "status": "HIGH",
            "value": f"{t.get('result_value')} {t.get('unit')}",
            "ref_range": t.get("reference_range_raw"),
            "explanation": f"Result is above the laboratory's reference range ({t.get('reference_range_raw')})."
        })
    for t in low_tests:
        key_findings.append({
            "test_name": t.get("test_name"),
            "status": "LOW",
            "value": f"{t.get('result_value')} {t.get('unit')}",
            "ref_range": t.get("reference_range_raw"),
            "explanation": f"Result is below the laboratory's reference range ({t.get('reference_range_raw')})."
        })
    for t in undetermined_tests:
        key_findings.append({
            "test_name": t.get("test_name"),
            "status": t.get("status"),
            "value": f"{t.get('result_value')} {t.get('unit')}",
            "ref_range": t.get("reference_range_raw"),
            "explanation": "Reference range was not explicitly specified on the source report; clinician verification recommended."
        })

    doctor_questions = [
        "What do these out-of-range test values indicate in the context of my current symptoms?",
        "Would you recommend repeating any of these tests or scheduling additional follow-up panels?",
        "Are there lifestyle, hydration, or dietary adjustments relevant to these findings?",
        "Do my current medications or supplements influence any of these test numbers?"
    ]

    return {
        "content": overview,
        "key_findings": key_findings,
        "doctor_questions": doctor_questions,
        "disclaimer": MANDATORY_DISCLAIMER
    }
