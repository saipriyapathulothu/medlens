# MedLens — Requirements Specification

## 1. Project Purpose & Problem Statement
Medical reports (blood tests, pathology reports, metabolic panels) are often delivered to patients as dense PDF documents or printed scanned images. Patients frequently struggle to:
- Understand which test results are normal or abnormal.
- Track changes across time between older and newer reports.
- Share an organized health summary with their healthcare providers.

**MedLens** solves this problem by taking patient intake details and uploaded lab documents (PDF/images), extracting the raw data, deterministically verifying lab values against the reference ranges printed on that specific report, allowing human-in-the-loop review, and generating a clear, patient-friendly summary without giving unauthorized medical advice.

---

## 2. Responsible AI & Safety Principles (Strict Medical Guardrails)

Because healthcare information is sensitive, MedLens operates under strict safety rules:

1. **Mandatory Disclaimer Banner**:
   > *"MedLens is an information organization and summarization tool. It does not provide medical diagnosis, prescribe medication, recommend dosage changes, or replace professional medical advice."*
   This banner must be visible in the user interface, on summary screens, and on all exported documents.

2. **No Medical Invention or Extrapolation**:
   - The system must **never** diagnose a medical condition (e.g., it must not say *"You have diabetes"*).
   - The system must **never** prescribe drugs or suggest changing dosages.
   - The system must **never** invent or fetch external reference ranges. A test is compared **only** against the reference range written on the uploaded document.

3. **Missing or Ambiguous Ranges**:
   - If a test has no reference range printed on the report: Status = `NOT_DETERMINED`.
   - If a test reference range is unclear or non-numeric: Status = `NEEDS_VERIFICATION`.
   - The user or clinician must be flagged to inspect and verify.

4. **Synthetic Data Policy**:
   - For hackathon development and testing, **only synthetic/fictional patient data** will be used. No real patient personal health information (PHI) may be stored or committed.

---

## 3. Core Functional Requirements

### Feature 1: Patient Information Intake Form
Collects baseline context about the patient:
- **Personal Details**: Full Name, Age, Sex, Date of Birth.
- **Health Context**: Current Symptoms, Existing Conditions (e.g., Asthma, Hypertension), Known Allergies, Current Medications, and Additional Notes.
- **Data Integrity**: Stored in a relational database tied to the logged-in user account.

### Feature 2: Medical Report Upload & Storage
- **Supported Formats**: `.pdf`, `.jpg`, `.png`.
- **Upload Validation**: File size limit (e.g., max 10MB), MIME-type checking, file name sanitization.
- **Storage**: Uploaded files are stored securely in a protected server directory (not publicly exposed via web URLs).

### Feature 3: Document Processing & Text Extraction
- **Digital PDFs**: Extracted using **PyMuPDF** (`fitz`) for fast, precise text extraction.
- **Scanned Images & Scanned PDFs**: Processed using **Tesseract OCR** (`pytesseract`) to convert image pixels into readable text.
- **Fallback Handling**: If OCR is unavailable or low quality, gracefully inform the user and allow manual entry.

### Feature 4: Structured Medical Record
Raw text is converted into clean, readable tables and cards displaying:
- **Test Name** (e.g., *Fasting Blood Glucose*, *Hemoglobin*)
- **Result / Value** (e.g., *145*)
- **Unit** (e.g., *mg/dL*)
- **Reference Range** (e.g., *70 - 99 mg/dL*)
- **Date** of sample collection or report
- **Observation / Status** (`LOW`, `NORMAL`, `HIGH`, `NOT_DETERMINED`, `NEEDS_VERIFICATION`)
- **Source Excerpt** (the exact text snippet from the report where the data came from)

### Feature 5: Deterministic Reference Range Evaluation
The system strictly applies the following deterministic rule:
- If `result < lower_bound`: Status = `LOW`
- If `lower_bound <= result <= upper_bound`: Status = `NORMAL`
- If `result > upper_bound`: Status = `HIGH`
- If no range was printed: Status = `NOT_DETERMINED`
- If range syntax is ambiguous (e.g. text comment without numbers): Status = `NEEDS_VERIFICATION`

### Feature 6: Human Verification & Editing
- Users/clinicians can view the extracted data side-by-side with the original report.
- Any incorrect test name, value, or unit can be edited directly.
- The user can click **Verify Result** to lock in the confirmed value.
- Every edit records who changed it and when (Audit Trail).

### Feature 7: Patient-Friendly AI Summary
- Generates a non-technical summary of the report in simple everyday language.
- Highlights tests that are flagged as `HIGH` or `LOW` based strictly on the document.
- Provides a list of suggested questions the patient can ask their doctor.
- Permanently attaches the medical disclaimer.

### Feature 8: Report Comparison & Trend Visualization
- Compares a previous lab report against the current lab report for the same patient.
- Shows side-by-side comparison tables (Old Value vs New Value, Change Delta).
- Renders visual line charts (using **Recharts**) to visualize biomarker trends across time.

### Feature 9: Timeline & Audit Trail
- A chronological feed recording:
  - Patient intake created
  - Report uploaded
  - Text processed
  - Human edits / verifications
  - Summary generated
  - PDF exported

### Feature 10: PDF Export
- Generates a clean, downloadable clinical summary PDF using **ReportLab**, including patient demographics, structured lab tables, status color indicators, source notes, and the mandatory disclaimer.

---

## 4. Security & Privacy Requirements
1. **User Authentication**: Secure signup and login using JSON Web Tokens (JWT).
2. **Password Security**: Passwords hashed using `bcrypt` (never stored as plain text).
3. **Data Isolation**: Users can only see and access their own patients and reports.
4. **Environment Variables**: Sensitive keys (such as `SECRET_KEY` and `OPENAI_API_KEY`) must reside in a `.env` file and never be hardcoded or checked into version control.
