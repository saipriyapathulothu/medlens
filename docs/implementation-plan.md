# MedLens — Implementation Plan & Hackathon Roadmap

## 1. Hackathon Feasibility Assessment

Building a full-stack clinical intelligence tool during a hackathon can be daunting, but with a modular, incremental approach, it is **100% achievable and high-impact**:

- **Why this plan is practical**:
  1. **SQLite Database**: Requires zero external database setup or cloud provisioning. A local file `medlens.db` works immediately.
  2. **Deterministic Rules First**: Range checking (`LOW`, `NORMAL`, `HIGH`, `NOT_DETERMINED`) relies on clean Python math and regex, which is fast, testable, and 100% reliable without external API latency.
  3. **Synthetic / Mock Data First**: We build sample lab reports (CBC, Lipid Panel, Metabolic Panel) first. This allows immediate testing of the parser and UI without waiting for complex AI setups.
  4. **Modular Phasing**: Each phase produces a working, testable piece of software. If time runs short in a hackathon, we always have a working demo ready to present.

---

## 2. Phased Implementation Roadmap

### Phase 1: Planning, Documentation & Setup (Current Step)
- [x] Analyze all user and functional requirements.
- [x] Document beginner-friendly architecture and technology roles.
- [x] Establish the folder structure.
- [x] Define synthetic data standards and medical safety rules.

### Phase 2: Synthetic Data & Baseline Samples
- Create sample synthetic lab reports (clean text, PDF, and image) representing:
  - Complete Blood Count (CBC) with standard reference ranges.
  - Comprehensive Metabolic Panel (CMP) with abnormal values (e.g., High Glucose).
  - Lipid Panel with missing/unclear reference ranges to test `NOT_DETERMINED` & `NEEDS_VERIFICATION`.
- Zero real patient health information (PHI) used.

### Phase 3: Backend Foundation (FastAPI + SQLite + Auth)
- Set up FastAPI app structure and configuration (`.env`).
- Define the 6 SQLAlchemy database models (`users`, `patients`, `reports`, `lab_results`, `summaries`, `audit_logs`).
- Build JWT authentication (Register, Login, current user validation, password hashing with bcrypt).
- Build Patient intake endpoints (Create, Read, Update).

### Phase 4: Document Ingestion & Deterministic Range Engine
- Build file upload endpoint (`/api/reports/upload`) with file validation.
- Implement text extraction using PyMuPDF (`fitz`) and OCR fallback using `pytesseract`.
- Implement the **Deterministic Range Evaluator**:
  - Extracts reference ranges explicitly written in the report.
  - Determines `LOW`, `NORMAL`, `HIGH`, `NOT_DETERMINED`, or `NEEDS_VERIFICATION`.
  - Strictly prevents invented reference ranges.
- Write unit tests to guarantee 100% mathematical accuracy on reference range classification.

### Phase 5: Human Verification, Audit Trail & AI Summary Engine
- Build `/api/lab-results/{id}` update and `/verify` endpoints.
- Record every human edit in the `audit_logs` table (who changed what, before and after values).
- Implement the patient-friendly summary engine with strict negative constraints (no diagnoses, no prescribing, no dosage recommendations).
- Implement ReportLab clinical summary PDF exporter.

### Phase 6: Frontend Development (React + Vite + Tailwind)
- Initialize Vite + React frontend project with Tailwind CSS and Lucide icons.
- Build persistent navigation and the permanent Medical Disclaimer banner.
- Build the 12 core screens:
  1. Landing Page (Overview, CTA, safety notice)
  2. Login / Register
  3. Dashboard (Summary stats, recent patients, quick actions)
  4. Patient Information Form (Intake)
  5. Upload Report (Drag-and-drop zone)
  6. Processing Screen (Animated progress steps)
  7. Structured Medical Record (Clean categorized tables with status badges)
  8. Source Verification (Side-by-side original text/document vs editable fields)
  9. AI Summary View (Non-diagnostic summary + questions for doctor)
  10. Report Comparison (Previous vs Current diff table + Recharts visual trend graphs)
  11. Timeline & Audit Trail (Chronological history of all events)
  12. PDF Export Preview & Download

### Phase 7: Verification, Testing & Polish
- Test the full end-to-end user journey with synthetic test files.
- Verify security: JWT expiration, user-isolated patient data, password hashing.
- Polish responsiveness for mobile and desktop screens.
- Prepare hackathon demonstration pitch and sample workflows.

---

## 3. Important Hackathon Rules Followed
- **No AI API integration yet** (focus first on robust parsing, database, and logic).
- **No real patient data** (all test cases will use fictional names and synthetic labs).
- **Step-by-step guidance** with clear explanations before any code is added.
