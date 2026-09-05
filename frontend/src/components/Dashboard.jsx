import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  UserCheck, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckSquare, 
  FileText, 
  ArrowRight, 
  Database, 
  Server, 
  ShieldCheck, 
  Cpu, 
  Layers,
  GitCompare,
  Clock,
  Download,
  AlertTriangle,
  Zap,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ 
  setActiveTab, 
  backendStatus, 
  systemData,
  selectedPatientId,
  setSelectedPatientId 
}) {
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    if (selectedPatientId) {
      api.getPatient(selectedPatientId).then(data => {
        setPatientData(data);
      }).catch(() => {});
    }
  }, [selectedPatientId]);

  const completeness = patientData?.completeness_metrics?.score || 82;
  const pendingConflicts = patientData?.conflicts?.filter(c => c.status === 'PENDING')?.length || 0;
  const unverifiedCount = patientData?.lab_results?.filter(l => !l.is_verified)?.length || 0;

  const quickActions = [
    {
      id: 'patient-info',
      title: '1. Patient Intake',
      desc: 'Demographics, symptoms, allergies, medications, and medical history with USER PROVIDED provenance.',
      icon: UserCheck,
      color: 'from-blue-500 to-blue-600',
      tag: 'Intake'
    },
    {
      id: 'upload-report',
      title: '2. Upload Medical Report',
      desc: 'Ingest PDF/images with PyMuPDF/OCR text extraction and 1-click synthetic demonstrators.',
      icon: UploadCloud,
      color: 'from-indigo-500 to-indigo-600',
      tag: 'PDF / OCR'
    },
    {
      id: 'review-queue',
      title: '3. Human Review Queue',
      desc: 'Inspect AI extractions with confidence levels. Accept All, Edit, Reject, or Verify.',
      icon: CheckSquare,
      color: 'from-purple-500 to-purple-600',
      tag: `${unverifiedCount} Need Review`
    },
    {
      id: 'medical-record',
      title: '4. Structured Medical Record',
      desc: 'Categorized lab results with deterministic reference ranges (LOW, NORMAL, HIGH, UNKNOWN).',
      icon: FileSpreadsheet,
      color: 'from-cyan-500 to-blue-600',
      tag: 'Lab Tables'
    },
    {
      id: 'conflicts',
      title: '5. Conflict Resolution',
      desc: 'Automated discrepancy detection between intake and reports (Age, DOB, medications).',
      icon: AlertTriangle,
      color: 'from-amber-500 to-amber-600',
      tag: `${pendingConflicts} Discrepancies`
    },
    {
      id: 'summary',
      title: '6. AI Clinical Summary',
      desc: 'Responsible, patient-friendly narrative without medical diagnosis or prescribing claims.',
      icon: FileText,
      color: 'from-blue-600 to-violet-600',
      tag: 'Non-Diagnostic'
    },
    {
      id: 'compare',
      title: '7. Report Comparison',
      desc: 'Compare previous and current reports with delta shift tables and visual biomarker trends.',
      icon: GitCompare,
      color: 'from-indigo-500 to-indigo-700',
      tag: 'Trends'
    },
    {
      id: 'timeline',
      title: '8. Provenance Timeline',
      desc: 'Immutable chronological audit log of all uploads, automated extractions, edits, and verifications.',
      icon: Clock,
      color: 'from-slate-600 to-slate-800',
      tag: 'Provenance'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" />
            Hackathon MVP • Clinical Information Intelligence
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            MedLens — Clinical Intelligence Dashboard
          </h1>

          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
            Transforming fragmented medical documents and patient intake into structured, traceable, and reviewable patient records. Powered by strict reference-range determinism and non-diagnostic clinical summarization.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('upload-report')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-800 font-bold text-xs hover:bg-blue-50 transition-all shadow-md active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              Upload & Process Report
            </button>

            <button
              onClick={() => setActiveTab('review-queue')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <CheckSquare className="w-4 h-4" />
              Review Queue ({unverifiedCount})
            </button>

            <button
              onClick={() => setActiveTab('medical-record')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/60 border border-blue-400/40 text-white font-bold text-xs hover:bg-blue-600 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              View Lab Records
            </button>
          </div>
        </div>
      </div>

      {/* Patient Overview & Data Quality Score Row */}
      {patientData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Patient Health Overview Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {patientData.first_name?.[0]}{patientData.last_name?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{patientData.first_name} {patientData.last_name}</h3>
                  <p className="text-[11px] text-slate-500">{patientData.age} Years • {patientData.sex} • DOB: {patientData.date_of_birth}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                Provenance: {patientData.provenance_source}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Symptoms</span>
                <p className="font-medium text-slate-800 mt-0.5">{patientData.symptoms || 'None reported'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Existing Conditions</span>
                <p className="font-medium text-slate-800 mt-0.5">{patientData.existing_conditions || 'None reported'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Allergies</span>
                <p className="font-medium text-rose-700 mt-0.5">{patientData.allergies || 'None reported'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Current Medications</span>
                <p className="font-medium text-slate-800 mt-0.5">{patientData.current_medications || 'None reported'}</p>
              </div>
            </div>

            {/* Conflict Alert Banner if any */}
            {pendingConflicts > 0 && (
              <div 
                onClick={() => setActiveTab('conflicts')}
                className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span><strong>{pendingConflicts} Information Conflict(s) Detected:</strong> Mismatch between intake and uploaded reports.</span>
                </div>
                <span className="font-bold text-amber-800 text-[11px] underline">Resolve &rarr;</span>
              </div>
            )}
          </div>

          {/* Data Quality & Completeness Card (Hackathon Differentiator) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-blue-600" /> Data Quality Score
                </span>
                <span className="text-[10px] font-bold text-slate-400">Documentation Metric</span>
              </div>

              <div className="pt-4 text-center space-y-2">
                <div className="text-4xl font-extrabold text-blue-700">{completeness}%</div>
                <p className="text-xs font-bold text-slate-800">Record Completeness</p>
                <p className="text-[11px] text-slate-500 leading-normal max-w-xs mx-auto">
                  Measures data completeness and verified source citations. Does <strong>not</strong> measure physiological health status.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Total Lab Tests:</span>
                <span className="font-bold text-slate-800">{patientData.lab_results?.length || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Verified Extractions:</span>
                <span className="font-bold text-emerald-700">
                  {patientData.lab_results?.filter(l => l.is_verified).length || 0}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pending Reviews:</span>
                <span className="font-bold text-purple-700">{unverifiedCount}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Clinical Workflow Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Clinical Workflow Navigation</h2>
          <span className="text-xs text-slate-500">Click any card to open view</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                onClick={() => setActiveTab(action.id)}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${action.color} text-white flex items-center justify-center shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                      {action.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs sm:text-sm">
                      {action.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Open Section</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
