import React from 'react';
import { 
  UserCheck, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  FileText, 
  Clock, 
  AlertTriangle,
  ArrowLeft,
  FileCheck
} from 'lucide-react';

export function PatientInfoPlaceholder({ setActiveTab }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-200">
          Phase 1 Prototype View
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Patient Intake Form</h2>
            <p className="text-xs text-slate-500">Collects baseline demographics, symptoms, conditions, and medications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Full Name</label>
            <input 
              type="text" 
              readOnly 
              value="Jane Doe (Synthetic Patient)" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Age & Sex</label>
            <input 
              type="text" 
              readOnly 
              value="38 Years • Female" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Reported Symptoms</label>
            <input 
              type="text" 
              readOnly 
              value="Fatigue, mild dizziness upon standing" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Known Allergies</label>
            <input 
              type="text" 
              readOnly 
              value="Penicillin" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium text-rose-700"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Current Medications</label>
            <input 
              type="text" 
              readOnly 
              value="Vitamin D3 2000 IU daily" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
          <FileCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Phase 1 Readiness:</strong> The SQLite <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">patients</code> schema is registered on the backend with all demographic, symptom, and allergy columns ready for live form submissions.
          </div>
        </div>
      </div>
    </div>
  );
}

export function UploadReportPlaceholder({ setActiveTab }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold border border-indigo-200">
          Phase 1 Prototype View
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upload Medical Report</h2>
            <p className="text-xs text-slate-500">Ingest PDF, JPG, and PNG files for automated parsing</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-10 text-center bg-indigo-50/40 space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Drop laboratory report here or browse</p>
            <p className="text-xs text-slate-500 mt-1">Supports PDF (PyMuPDF) and Scanned Images (Tesseract OCR)</p>
          </div>
          <span className="inline-block px-3 py-1 bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg shadow-xs">
            Sample File: synthetic_cbc_panel_2026.pdf
          </span>
        </div>
      </div>
    </div>
  );
}

export function MedicalRecordPlaceholder({ setActiveTab }) {
  const sampleLabs = [
    { test: "Fasting Blood Glucose", val: "145", unit: "mg/dL", range: "70 - 99 mg/dL", status: "HIGH", color: "bg-rose-50 text-rose-700 border-rose-200" },
    { test: "Hemoglobin", val: "13.8", unit: "g/dL", range: "12.0 - 16.0 g/dL", status: "NORMAL", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { test: "White Blood Count (WBC)", val: "6.2", unit: "10^3/uL", range: "4.5 - 11.0 10^3/uL", status: "NORMAL", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { test: "Serum Ferritin", val: "22", unit: "ng/mL", range: "Not Specified", status: "NOT_DETERMINED", color: "bg-slate-100 text-slate-700 border-slate-300" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-full font-semibold border border-cyan-200">
          Deterministic Range Demonstration
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Structured Medical Record</h2>
            <p className="text-xs text-slate-500">Values evaluated strictly using source report reference ranges</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Test Name</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Source Reference Range</th>
                <th className="py-3 px-4">Deterministic Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sampleLabs.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{item.test}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.val} <span className="text-xs font-normal text-slate-500">{item.unit}</span></td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{item.range}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.color}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Notice: Serum Ferritin has no printed range in the source document, so status is deterministically marked <strong>NOT_DETERMINED</strong> (never invented).</span>
        </div>
      </div>
    </div>
  );
}

export function VerificationPlaceholder({ setActiveTab }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold border border-teal-200">
          Phase 1 Prototype View
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Source Verification & Audit</h2>
            <p className="text-xs text-slate-500">Human-in-the-loop review against original medical report</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Original Source Snippet</span>
            <p className="text-xs font-mono text-slate-800 bg-white p-3 rounded-lg border border-slate-200">
              "GLUCOSE, FASTING: 145 MG/DL [REF: 70 - 99 MG/DL] (ABNORMAL: HIGH)"
            </p>
            <span className="text-[11px] text-slate-500">Source: PDF Page 1, Section 2 (Quest Diagnostics)</span>
          </div>

          <div className="border border-teal-200 rounded-xl p-4 bg-teal-50/40 space-y-2">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Verified State</span>
            <div className="text-xs text-teal-900 space-y-1">
              <div><strong>Value:</strong> 145 mg/dL</div>
              <div><strong>Status:</strong> HIGH</div>
              <div><strong>Verified by:</strong> Dr. Alex Rivera (Clinician)</div>
              <div><strong>Audit Timestamp:</strong> 2026-09-05 11:45 UTC</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SummaryPlaceholder({ setActiveTab }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-200">
          Phase 1 Prototype View
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Patient-Friendly AI Summary</h2>
            <p className="text-xs text-slate-500">Safe, non-diagnostic clinical explanation</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm">Key Findings Summary</h4>
            <p className="text-xs text-slate-600">
              The blood report from August 15, 2026 shows 1 out of 4 parameters flagged outside the source laboratory's reference range. Specifically, Fasting Blood Glucose was recorded at 145 mg/dL, which is above the laboratory's reference range of 70 to 99 mg/dL.
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
            <h4 className="font-bold text-blue-900 text-sm">Recommended Questions for Your Healthcare Provider</h4>
            <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
              <li>"Would you recommend repeating the fasting blood glucose test or checking an HbA1c test?"</li>
              <li>"Could my current symptoms of fatigue be related to these test findings?"</li>
              <li>"Are there dietary or lifestyle modifications I should be mindful of?"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
