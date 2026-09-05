# MedLens — System Architecture (Beginner-Friendly Guide)

## 1. High-Level Picture: How Does MedLens Work?

Think of MedLens as three main building blocks working as a team:

```
┌────────────────────────────────┐
│   1. Frontend (The Visuals)    │  <--- What you see in your web browser
│   React + Vite + Tailwind CSS  │
└───────────────┬────────────────┘
                │  Communicates via REST API (HTTP requests / JSON)
                ▼
┌────────────────────────────────┐
│   2. Backend (The Brain)       │  <--- Processes files, extracts data, checks ranges
│   Python + FastAPI             │
└───────────────┬────────────────┘
                │  Saves and loads data
                ▼
┌────────────────────────────────┐
│   3. Database (The Memory)     │  <--- Safely stores patients, reports & test results
│   SQLite Database (single file)│
└────────────────────────────────┘
```

---

## 2. Explaining Each Technology in Simple Words

| Technology | What is it? | Why are we using it? |
| :--- | :--- | :--- |
| **React** | A popular JavaScript library for building interactive websites. | Lets us create reusable visual parts (buttons, cards, forms, tables) that update instantly without refreshing the page. |
| **Vite** | A modern development server for React. | Starts up in seconds, compiles code lightning fast, and makes web development smooth and enjoyable. |
| **Tailwind CSS** | A styling framework with ready-made design classes. | Allows us to make clean, modern, professional healthcare screens (clean white cards, blue accents) without writing hundreds of lines of raw CSS. |
| **Recharts** | A charting library for React. | Easily draws clean line and bar charts to show patients how their lab values (e.g., Glucose) have changed over time. |
| **Python** | A clean, beginner-friendly programming language. | Outstanding ecosystem for document processing, OCR, data handling, and AI tasks. |
| **FastAPI** | A modern, fast Python web framework. | Creates web endpoints (APIs) with automatic data validation, high speed, and interactive test documentation (`/docs`). |
| **SQLite** | A lightweight relational database stored in a single file (`medlens.db`). | Zero setup required, no separate database server to install or manage, perfect for hackathons and local development, yet easily upgradeable to PostgreSQL later. |
| **PyMuPDF (`fitz`)** | A fast Python library for reading PDF documents. | Directly reads text, columns, and tables from digital PDF lab reports without losing formatting. |
| **Tesseract OCR** | Optical Character Recognition engine. | "Reads" letters and numbers from picture files (`.png`, `.jpg`) and scanned documents when digital text isn't available. |
| **ReportLab** | A Python library for creating PDF files. | Generates a clean, professional, downloadable medical summary PDF for the patient or doctor. |
| **OpenAI API** | An AI engine used strictly for structuring text. | Organizes extracted text snippets into clean JSON fields. In MedLens, the API key stays safely on the backend only. |

---

## 3. The 6 Database Tables (Data Model)

A database is like a collection of spreadsheets with relationships between them:

1. **`users` Table** (Who can log in)
   - `id`: Unique user ID
   - `email`: User email address (unique)
   - `hashed_password`: Encrypted password (never stored as plain text!)
   - `full_name`: User's full name
   - `role`: Role (`patient` or `clinician`)
   - `created_at`: Account creation time

2. **`patients` Table** (Patient health profiles)
   - `id`: Unique patient ID
   - `user_id`: Links to the user who created this patient
   - `first_name`, `last_name`, `dob`, `age`, `sex`
   - `symptoms`: Current issues the patient feels
   - `existing_conditions`: Ongoing medical history (e.g., Asthma)
   - `allergies`: Known medication or food allergies
   - `current_medications`: Medicines currently taken
   - `other_info`: Extra notes

3. **`reports` Table** (The uploaded document)
   - `id`: Unique report ID
   - `patient_id`: Which patient this report belongs to
   - `file_name`: Original name of the uploaded file
   - `file_path`: Where the file is stored safely on disk
   - `file_type`: `.pdf`, `.jpg`, or `.png`
   - `report_date`: Date of the lab test
   - `status`: Status (`uploaded`, `processing`, `completed`, `failed`)
   - `raw_text`: The text extracted from the document

4. **`lab_results` Table** (Each individual test inside a report)
   - `id`: Unique test result ID
   - `report_id`: Which report it came from
   - `patient_id`: Which patient it belongs to
   - `test_name`: Name of the test (e.g., "Fasting Blood Glucose")
   - `result_value`: The numeric result (e.g., 145)
   - `unit`: Unit of measurement (e.g., "mg/dL")
   - `reference_range_raw`: The exact range written in the report (e.g., "70-99 mg/dL")
   - `ref_min`: Parsed lower number (e.g., 70.0)
   - `ref_max`: Parsed upper number (e.g., 99.0)
   - `status`: Result status (`LOW`, `NORMAL`, `HIGH`, `NOT_DETERMINED`, `NEEDS_VERIFICATION`)
   - `observation`: Brief note (e.g., "Above reference range")
   - `source_text`: The exact sentence in the report where this was found
   - `source_type`: `report_extracted`, `user_provided`, or `ai_generated`
   - `is_verified`: True if a human reviewed and confirmed it
   - `verified_at`: Timestamp of human verification

5. **`summaries` Table** (Safe AI summaries)
   - `id`: Unique summary ID
   - `patient_id`: Patient link
   - `report_id`: Report link
   - `content`: Plain language summary with points for doctor discussion
   - `disclaimer`: Permanent non-diagnostic warning

6. **`audit_logs` Table** (History of all changes)
   - `id`: Unique log entry ID
   - `patient_id`: Patient link
   - `user_id`: Who made the action
   - `action`: What happened (e.g., `REPORT_UPLOADED`, `VALUE_EDITED`, `VERIFIED`)
   - `changes`: Record of what changed before vs. after
   - `timestamp`: Exactly when it happened

---

## 4. End-to-End Flow (Step-by-Step)

```
[1. User Intake] ──────────► Save Demographics, Symptoms, Medications to DB
                                    │
[2. Upload Report] ────────► Save file to disk; Record in reports table
                                    │
[3. Text Extraction] ──────► PyMuPDF (PDF) or Tesseract (Scanned image)
                                    │
[4. Data Structuring] ─────► Group into Tests: Name, Value, Unit, Source Range
                                    │
[5. Range Evaluator] ──────► Deterministic calculation:
                             - If value < min  ==> LOW
                             - If min <= value <= max ==> NORMAL
                             - If value > max  ==> HIGH
                             - If range missing ==> NOT_DETERMINED
                             - If unclear      ==> NEEDS_VERIFICATION
                                    │
[6. Human Review] ─────────► User sees Side-by-Side view:
                             Left: Original file snippet
                             Right: Extracted fields (editable)
                             Click "Verify" ==> Saves to DB & Audit Log
                                    │
[7. Summary & Trends] ─────► Generate non-diagnostic summary & Recharts trend
                                    │
[8. Export PDF] ───────────► ReportLab creates downloadable clinical summary
```
