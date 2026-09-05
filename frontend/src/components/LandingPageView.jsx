import React from 'react';
import { 
  Activity, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  GitCompare, 
  Layers, 
  Zap,
  Sparkles,
  Lock,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';

export default function LandingPageView({ setActiveTab, setSelectedPatientId }) {
  
  const handleLaunchDemo = async () => {
    try {
      await api.seedDemoData();
      setSelectedPatientId(1); // Sarah Jenkins
      setActiveTab('dashboard');
    } catch (e) {
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="space-y-16 pb-20 max-w-6xl mx-auto">
      
      {/* 1. Hero Section */}
      <section className="text-center pt-8 sm:pt-14 space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-2xs">
          <Activity className="w-4 h-4 text-blue-600" />
          MedLens AI • Clinical Information Intelligence
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Turn fragmented medical information into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">one clear, traceable record.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          MedLens uses AI to extract, organize, compare, and summarize medical reports while keeping humans in complete control. Designed with strict reference-range determinism and zero medical hallucination.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleLaunchDemo}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm shadow-xs transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-500" /> Explore Demo (Patient A & B)
          </button>
        </div>

        {/* Responsible AI Banner */}
        <div className="pt-6 max-w-xl mx-auto">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Strict Non-Diagnostic Platform • No invented medical reference ranges.</span>
          </div>
        </div>
      </section>

      {/* 2. How It Works (4 Steps) */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">The Clinical Pipeline</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How MedLens Transforms Clinical Data</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">1</div>
            <h3 className="font-bold text-slate-900 text-sm">Patient Intake</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Capture patient demographics, symptoms, conditions, allergies, and medications with immutable <strong>USER PROVIDED</strong> provenance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">2</div>
            <h3 className="font-bold text-slate-900 text-sm">OCR & AI Extraction</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              PyMuPDF & Tesseract extract digital and scanned PDF/image text into structured JSON fields with page numbers and verbatim snippets.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">3</div>
            <h3 className="font-bold text-slate-900 text-sm">Deterministic Checking</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Evaluates LOW, NORMAL, or HIGH <strong>strictly against source ranges</strong>. Missing ranges are tagged UNKNOWN, never invented.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">4</div>
            <h3 className="font-bold text-slate-900 text-sm">Verification & Summary</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Clinicians review, edit, and confirm data before a non-diagnostic, patient-friendly summary and PDF report are generated.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Core Features Showcase */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Enterprise Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Why Clinicians & Patients Trust MedLens</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Zero Hallucination Range Logic</h4>
            <p className="text-slate-600 leading-relaxed">
              Never searches the internet or uses external reference standard databases. A lab value is only evaluated if the uploaded document explicitly states the reference range.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Full Source Provenance</h4>
            <p className="text-slate-600 leading-relaxed">
              Every single extracted number links back to the original document name, page number, and verbatim excerpt. Complete audit transparency.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <GitCompare className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Automated Conflict Detection</h4>
            <p className="text-slate-600 leading-relaxed">
              Discrepancies in patient age, dates, or medications between user intake and lab documents are flagged immediately for human resolution.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA */}
      <section className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold max-w-xl mx-auto">
          Ready to experience clinical information intelligence?
        </h2>
        <p className="text-blue-100 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          Open the synthetic demo mode now with preloaded patient test panels and automated conflict detection.
        </p>
        <button
          onClick={handleLaunchDemo}
          className="px-8 py-3.5 bg-white text-blue-900 font-bold text-xs sm:text-sm rounded-xl hover:bg-blue-50 shadow-md active:scale-95 transition-all"
        >
          Launch Interactive Demo &rarr;
        </button>
      </section>

    </div>
  );
}
