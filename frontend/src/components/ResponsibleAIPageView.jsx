import React from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  AlertTriangle, 
  Lock, 
  FileSearch, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  FileText 
} from 'lucide-react';

export default function ResponsibleAIPageView({ setActiveTab }) {
  const principles = [
    {
      title: "1. Strictly Non-Diagnostic & Non-Prescriptive",
      icon: XCircle,
      color: "text-rose-600 bg-rose-50",
      description: "MedLens operates strictly under the principle that AI must never formulate a medical diagnosis, predict illness, prescribe medications, or recommend changes to prescription dosages. The software is an organization and summarization tool, not a doctor."
    },
    {
      title: "2. Reference-Range Discipline",
      icon: Cpu,
      color: "text-blue-600 bg-blue-50",
      description: "The platform never looks up external medical reference intervals or queries the internet to decide what is normal. A test result is evaluated only when the source laboratory report provides an explicit reference range. If a range is missing, status is designated UNKNOWN / NOT ASSESSABLE."
    },
    {
      title: "3. Complete Source Provenance & Auditability",
      icon: FileSearch,
      color: "text-teal-600 bg-teal-50",
      description: "Every single extracted value preserves its document origin, page number, confidence indicator, and verbatim source snippet. Users can inspect the original sentence from which a value was drawn with a single click."
    },
    {
      title: "4. Human-in-the-Loop Verification",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
      description: "AI-extracted data is treated as a provisional proposal. Records require explicit human review, inline editing, and confirmation before receiving official 'USER VERIFIED' clinical status."
    },
    {
      title: "5. Uncertainty & Data Quality Transparency",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50",
      description: "Low-confidence OCR and extraction outputs are prominently flagged for review. Missing intake fields and ambiguous ranges are made clearly visible rather than filled in with AI extrapolations."
    },
    {
      title: "6. Patient Privacy & Data Isolation",
      icon: Lock,
      color: "text-purple-600 bg-purple-50",
      description: "Medical documents are stored in protected directories, access is scoped strictly to authorized user accounts, and users retain the right to permanently delete all associated patient records and uploaded documents."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold border border-blue-200">
          Medical AI Ethics & Safety Architecture
        </span>
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xs space-y-8">
        <div className="space-y-3 border-b border-slate-100 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Responsible AI & Clinical Safety Framework
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            Healthcare decisions require mathematical precision, auditability, and clear ethical boundaries. MedLens is built from the ground up around non-negotiable safety guardrails.
          </p>
        </div>

        {/* Permanent Medical Notice */}
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
          <div className="font-bold flex items-center gap-2 text-sm text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Mandatory Disclaimer
          </div>
          <p className="leading-relaxed">
            "MedLens helps organize and explain medical information. It does not provide medical diagnosis or treatment advice. Always consult a qualified healthcare professional for medical decisions."
          </p>
        </div>

        {/* 6 Core Ethics Principles */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Core Architectural Safeguards
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {principles.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-xs text-slate-900">{p.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Limitations Section */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Known AI Limitations
          </h2>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <li><strong>OCR Artifacts:</strong> Scanned documents with poor resolution, hand-written physician annotations, or folds may yield partial text. The human review queue is mandatory for this reason.</li>
            <li><strong>Assay Variability:</strong> Different clinical laboratories utilize different test methodologies. MedLens preserves the specific laboratory name and range from that exact report.</li>
            <li><strong>Non-Equivalence:</strong> Categorical qualitative tests (e.g. Reactive vs Non-Reactive) are never forced into numerical HIGH/LOW comparisons.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
