import React, { useState } from 'react';
import { 
  Settings, 
  ArrowLeft, 
  Trash2, 
  Download, 
  Zap, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  FileSpreadsheet, 
  Database 
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPageView({ 
  setActiveTab, 
  selectedPatientId, 
  setSelectedPatientId 
}) {
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedSuccess(false);
    setErrorMsg(null);
    try {
      await api.seedDemoData();
      setSeedSuccess(true);
      setSelectedPatientId(1);
      setTimeout(() => setSeedSuccess(false), 4000);
    } catch (err) {
      setErrorMsg('Failed to seed demo data. Verify backend is running.');
    } finally {
      setSeeding(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this patient record and all associated reports?")) {
      return;
    }
    setDeleting(true);
    try {
      await api.deletePatient(selectedPatientId);
      setDeleteSuccess(true);
      setSelectedPatientId(1);
      setTimeout(() => setDeleteSuccess(false), 4000);
    } catch (err) {
      setErrorMsg('Failed to delete patient record.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
          System Configuration & Privacy
        </span>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-xs">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Application Settings & Data Controls</h2>
            <p className="text-xs text-slate-500">Manage demo data, system exports, and privacy-compliant data deletion</p>
          </div>
        </div>

        {seedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Synthetic demo data (Patient A & Patient B) refreshed in SQLite database!</span>
          </div>
        )}

        {deleteSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Patient record and all extracted documents permanently purged from database.</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Synthetic Demo Mode Seeder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Hackathon Demonstration Mode
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-populate or reset synthetic patient profiles (Sarah Jenkins & Marcus Chen) with multiple lab panels.
              </p>
            </div>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {seeding ? 'Seeding...' : 'Reset Demo Records'}
            </button>
          </div>
        </div>

        {/* Section 2: Clinical Data Export */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Structured Record Export
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export complete patient records including laboratory findings, source provenance, and audit logs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href={api.getPatientPdfUrl(selectedPatientId || 1)}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600" /> Export PDF Summary
              </span>
              <span className="text-[10px] text-slate-400">ReportLab</span>
            </a>

            <a
              href={api.getPatientJsonUrl(selectedPatientId || 1)}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600" /> Export Full JSON
              </span>
              <span className="text-[10px] text-slate-400">Provenance</span>
            </a>

            <a
              href={api.getPatientCsvUrl(selectedPatientId || 1)}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-teal-600" /> Export Lab CSV
              </span>
              <span className="text-[10px] text-slate-400">Spreadsheet</span>
            </a>
          </div>
        </div>

        {/* Section 3: AI Engine Preferences */}
        <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-slate-700">
              3. AI Processing Provider
            </h3>
            <p className="text-slate-500 mt-0.5">
              Select extraction and summarization engine.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-bold text-slate-900">Hybrid AI Extraction Engine</div>
                <div className="text-[11px] text-slate-500">Uses OpenAI (if API key present) + Deterministic Regex Fallback (100% offline reliable)</div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
              Active & Ready
            </span>
          </div>
        </div>

        {/* Section 4: Privacy & Permanent Data Deletion */}
        <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-rose-800">
              4. Patient Privacy & Data Purging
            </h3>
            <p className="text-slate-500 mt-0.5">
              Permanently delete current patient record, uploaded PDF documents, and all audit logs.
            </p>
          </div>

          <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-rose-900">Purge Active Patient Record (ID #{selectedPatientId || 1})</div>
              <div className="text-[11px] text-rose-700">This action cannot be undone. Complies with clinical data deletion guidelines.</div>
            </div>
            <button
              onClick={handleDeletePatient}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition-colors active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete Patient Data'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
