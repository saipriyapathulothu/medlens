import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  ArrowLeft, 
  Cpu, 
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

export default function UploadReportView({ setActiveTab, selectedPatientId, onReportProcessed }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [reportDate, setReportDate] = useState('2026-09-01');
  const [labFacility, setLabFacility] = useState('MetroHealth Diagnostic Laboratories');
  const [processingState, setProcessingState] = useState('idle'); // 'idle' | 'uploading' | 'extracting' | 'evaluating' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState(null);
  const [processedReport, setProcessedReport] = useState(null);

  // One-click synthetic sample loaders for hackathon demonstration
  const sampleReports = [
    {
      name: 'Sample 1: Complete Blood Count (CBC)',
      type: 'Normal Ranges',
      desc: 'All hematology parameters fall inside reference bounds.',
      file_name: 'sample_cbc_normal.txt',
      content: `METROHEALTH DIAGNOSTIC LABORATORIES
PATIENT INFORMATION: Jane Doe | DOB: 1988-04-12 | Sex: Female
Collection Date: 2026-08-15 | Report Date: 2026-08-15

TEST NAME                       RESULT    FLAG    UNITS       REFERENCE RANGE
-----------------------------------------------------------------------------
COMPLETE BLOOD COUNT (CBC)
White Blood Cells (WBC)          6.2              10^3/uL     4.5 - 11.0
Red Blood Cells (RBC)            4.45             10^6/uL     4.00 - 5.20
Hemoglobin                       13.8             g/dL        12.0 - 16.0
Hematocrit                       41.2             %           37.0 - 47.0
Mean Corpuscular Volume (MCV)    88.5             fL          80.0 - 100.0
Platelets                        265              10^3/uL     150 - 450`
    },
    {
      name: 'Sample 2: Metabolic Panel (CMP)',
      type: 'Abnormal Ranges (High & Low)',
      desc: 'High Glucose (145 mg/dL) and Low Potassium (3.2 mmol/L).',
      file_name: 'sample_cmp_abnormal.txt',
      content: `METROHEALTH DIAGNOSTIC LABORATORIES
PATIENT INFORMATION: Jane Doe | DOB: 1988-04-12 | Sex: Female
Collection Date: 2026-09-01 | Report Date: 2026-09-01

TEST NAME                       RESULT    FLAG    UNITS       REFERENCE RANGE
-----------------------------------------------------------------------------
COMPREHENSIVE METABOLIC PANEL (CMP)
Fasting Blood Glucose            145      HIGH    mg/dL       70 - 99
Blood Urea Nitrogen (BUN)        16               mg/dL       7 - 20
Serum Creatinine                 0.9              mg/dL       0.6 - 1.2
eGFR Non-African Amer            98               mL/min/1.73 > 60
Sodium                           140              mmol/L      136 - 145
Potassium                        3.2      LOW     mmol/L      3.5 - 5.1
Chloride                         102              mmol/L      98 - 107
Carbon Dioxide (CO2)             25               mmol/L      22 - 29
Calcium                          9.4              mg/dL       8.6 - 10.2
Total Protein                    7.1              g/dL        6.4 - 8.3
Albumin                          4.3              g/dL        3.5 - 5.0`
    },
    {
      name: 'Sample 3: Lipid & Cardiac Profile',
      type: 'Missing & Ambiguous Ranges',
      desc: 'Tests NOT_DETERMINED (Triglycerides) and NEEDS_VERIFICATION (hs-CRP).',
      file_name: 'sample_lipid_ambiguous.txt',
      content: `METROHEALTH DIAGNOSTIC LABORATORIES
PATIENT INFORMATION: Jane Doe | DOB: 1988-04-12 | Sex: Female
Collection Date: 2026-09-02 | Report Date: 2026-09-02

TEST NAME                       RESULT    FLAG    UNITS       REFERENCE RANGE
-----------------------------------------------------------------------------
LIPID & CARDIAC PROFILE
Total Cholesterol                218              mg/dL       < 200
HDL Cholesterol                  54               mg/dL       > 50
LDL Cholesterol (Calc)           138              mg/dL       < 100
Triglycerides                    162              mg/dL       Not Specified
C-Reactive Protein (hs-CRP)      1.4              mg/dL       See Note*
Serum Ferritin                   22               ng/mL       Ambiguous / Pending`
    }
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const processBlob = async (fileObj) => {
    setProcessingState('uploading');
    setErrorMsg(null);

    try {
      const patientId = selectedPatientId || 1;
      const formData = new FormData();
      formData.append('patient_id', patientId);
      formData.append('report_date', reportDate);
      formData.append('lab_facility', labFacility);
      formData.append('file', fileObj);

      // 1. Upload
      const uploadedReport = await api.uploadReport(formData);
      if (!uploadedReport || !uploadedReport.id) {
        throw new Error('Report upload failed');
      }

      // 2. Extract & Deterministic Processing
      setProcessingState('extracting');
      await new Promise(r => setTimeout(r, 600)); // Smooth animation step
      setProcessingState('evaluating');
      
      const processed = await api.processReport(uploadedReport.id);
      setProcessedReport(processed);
      if (onReportProcessed) {
        onReportProcessed(processed);
      }

      setProcessingState('done');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process report. Check that backend is running.');
      setProcessingState('error');
    }
  };

  const handleLoadSample = (sample) => {
    const blob = new Blob([sample.content], { type: 'text/plain' });
    const file = new File([blob], sample.file_name, { type: 'text/plain' });
    setSelectedFile(file);
    processBlob(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold border border-indigo-200">
          Upload & Ingestion Pipeline
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upload Medical Report</h2>
            <p className="text-xs text-slate-500">Supports PDF, JPG, PNG, and synthetic lab text formats</p>
          </div>
        </div>

        {/* 1-Click Synthetic Sample Demonstrators */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Zap className="w-4 h-4 text-amber-500" />
              1-Click Synthetic Demonstrators (Hackathon Fast-Test)
            </div>
            <span className="text-[11px] text-slate-500">No external file required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sampleReports.map((sample, idx) => (
              <div 
                key={idx}
                onClick={() => handleLoadSample(sample)}
                className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {sample.type}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors">
                    {sample.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {sample.desc}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] font-bold text-indigo-600 flex items-center justify-between">
                  <span>Load & Process</span>
                  <span>&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual File Dropzone */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Report Date</label>
              <input 
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Laboratory Facility</label>
              <input 
                type="text"
                value={labFacility}
                onChange={(e) => setLabFacility(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50 hover:bg-indigo-50/20 cursor-pointer block transition-colors">
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg,.txt" 
              onChange={handleFileChange}
              className="hidden" 
            />
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              {selectedFile ? selectedFile.name : 'Click to browse or drag & drop laboratory document'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports PDF (PyMuPDF) and Scanned Images/Photos (Tesseract OCR)
            </p>
          </label>

          {selectedFile && processingState === 'idle' && (
            <button
              onClick={() => processBlob(selectedFile)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              Start Automated Document Ingestion & Extraction
            </button>
          )}
        </div>

        {/* Processing State Animation */}
        {processingState !== 'idle' && (
          <div className="border border-indigo-200 bg-indigo-50/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
              <div className="flex items-center gap-2">
                {processingState === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                )}
                <span>
                  {processingState === 'uploading' && 'Step 1: Uploading and storing document...'}
                  {processingState === 'extracting' && 'Step 2: PyMuPDF / OCR Text & Table Extraction...'}
                  {processingState === 'evaluating' && 'Step 3: Deterministic Reference Range Evaluation (Zero Hallucination)...'}
                  {processingState === 'done' && 'Processing Complete! Extracted & Verified.'}
                  {processingState === 'error' && 'Error processing report'}
                </span>
              </div>
              {processingState === 'done' && (
                <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  100% Ready
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: processingState === 'uploading' ? '25%' :
                         processingState === 'extracting' ? '60%' :
                         processingState === 'evaluating' ? '85%' :
                         processingState === 'done' ? '100%' : '10%'
                }}
              />
            </div>

            {processingState === 'done' && (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Extracted structured laboratory tests are now ready for review.
                </span>
                <button
                  onClick={() => setActiveTab('medical-record')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  View Structured Medical Record &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
