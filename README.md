# MedLens — AI-Powered Clinical Information Intelligence

> **Hackathon MVP**: Transforming fragmented clinical information into structured, understandable, traceable, and reviewable patient records.

---

## ⚠️ Mandatory Safety Notice
> **IMPORTANT**: MedLens is an **information organization and communication tool**, not a medical diagnostic or treatment platform. It **never** diagnoses diseases, prescribes medications, or modifies dosages. All findings require review by a qualified healthcare professional.

---

## 🌐 Localhost Links

Once the servers are running, access the platform at:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Interactive 12-screen React Dashboard & Patient Intelligence UI |
| **Backend API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | FastAPI REST API engine |
| **Interactive API Docs (Swagger)** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Test every REST endpoint directly in browser |
| **API Health Check** | [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) | Backend health verification endpoint |

---

## 🚀 Quick Start Guide (Windows)

### Prerequisites
Make sure **Python 3.10+** and **Node.js 18+** are installed on your system.
If not installed yet, you can install them via Windows Package Manager:
```powershell
winget install Python.Python.3.11
winget install OpenJS.NodeJS.LTS
```

---

### Step 1: Start the Backend Server (Terminal 1)
```powershell
cd backend
pip install -r requirements.txt
python run_backend.py
```
*Backend will start on `http://127.0.0.1:8000` and automatically seed demo synthetic patients (Sarah Jenkins & Marcus Chen).*

---

### Step 2: Start the Frontend UI (Terminal 2)
```powershell
cd frontend
npm install
npm run dev
```
*Frontend will launch on `http://localhost:5173` with instant hot-reloading.*

---

## 🌟 Core Features & Clinical Modules

1. **Dashboard**: High-level telemetry, data completeness score (0–100%), and discrepancy alert chips.
2. **Patient Intake**: Structured capture of demographics, symptoms, conditions, allergies, and current medications.
3. **Medical Report Ingestion**: PyMuPDF & OCR text extraction with drag-and-drop file upload + 1-click synthetic demonstrators (CBC Normal, CMP Abnormal, Lipid Ambiguous).
4. **Deterministic Reference Range Engine**: Evaluates lab values strictly against source report reference intervals (`LOW`, `NORMAL`, `HIGH`, `UNKNOWN`). **Never invents or hallucinated standards**.
5. **Human-in-the-Loop Extraction Review**: Accept, edit, reject, and verify extracted biomarkers with confidence indicators.
6. **Conflict & Discrepancy Detector**: Identifies contradictions between intake history and report findings (e.g. intake age 45 vs report age 47).
7. **Side-by-Side Provenance & Verification**: Direct document text citation for every data point with exact snippet tracking.
8. **Responsible AI Plain-Language Summary**: Non-diagnostic overview and actionable questions to discuss with a physician.
9. **Analyte Trajectory & Comparison**: Multi-report biomarker comparison table with directional shifts ($\pm\Delta$) and sparkline trends.
10. **Audit Timeline**: Timestamped log of intake, uploads, extractions, edits, and resolutions.
11. **Clinical PDF Export**: Standardized downloadable clinical report.
12. **Responsible AI & Governance**: Full transparency page detailing safety guardrails and algorithmic ethics.
