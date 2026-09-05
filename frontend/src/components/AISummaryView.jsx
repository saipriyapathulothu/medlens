import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ArrowLeft, 
  Sparkles, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Download
} from 'lucide-react';
import { api } from '../services/api';

export default function AISummaryView({ setActiveTab, selectedPatientId, currentReport }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const patientId = selectedPatientId || 1;
      const data = await api.getSummary(patientId);
      if (data && data.content) {
        setSummary(data);
      }
    } catch (err) {
      // If none found, we can let user generate one
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedPatientId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const patientId = selectedPatientId || 1;
      const reportId = currentReport?.id || null;
      const data = await api.generateSummary(patientId, reportId);
      setSummary(data);
    } catch (err) {
      console.error("Summary generation error", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('medical-record')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Structured Record
        </button>
        <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200">
          Responsible AI Clinical Summary
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Patient-Friendly Clinical Summary</h2>
              <p className="text-xs text-slate-500">Strictly non-diagnostic narrative explaining test parameters in clear language</p>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generating Safe Summary...' : 'Generate New AI Summary'}
          </button>
        </div>

        {/* Permanent Medical Disclaimer Card */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong>Permanent Responsible AI Notice:</strong>
            <p>
              MedLens is an information organization and summarization tool. It does not provide medical diagnosis, prescribe medication, recommend dosage changes, or replace professional medical advice. Always consult a qualified healthcare provider for clinical evaluation.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading clinical summary...
          </div>
        ) : !summary ? (
          <div className="py-12 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-blue-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Summary Generated Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click the button above to generate a safe, patient-friendly summary based on the patient's intake and extracted lab results.
            </p>
            <button
              onClick={handleGenerate}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Generate AI Summary Now
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Overview Box */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Clinical Overview</span>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                {summary.content}
              </p>
            </div>

            {/* Key Findings */}
            {summary.key_findings && summary.key_findings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Notable Test Parameters (Based Strictly on Laboratory Reference Ranges)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {summary.key_findings.map((finding, idx) => (
                    <div 
                      key={idx}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{finding.test_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          finding.status === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          finding.status === 'LOW' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {finding.status}
                        </span>
                      </div>
                      {finding.value && (
                        <div className="text-xs font-mono font-bold text-slate-700">
                          {finding.value} <span className="text-[10px] font-normal text-slate-500">(Ref: {finding.ref_range})</span>
                        </div>
                      )}
                      <p className="text-xs text-slate-600 leading-normal">
                        {finding.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Doctor Questions */}
            {summary.doctor_questions && summary.doctor_questions.length > 0 && (
              <div className="bg-blue-50/60 rounded-2xl p-6 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Questions Recommended for Your Healthcare Provider
                  </h3>
                </div>
                <div className="space-y-2">
                  {summary.doctor_questions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-blue-950 font-medium bg-white/80 p-3 rounded-xl border border-blue-100">
                      <span className="text-blue-500 font-bold">{i + 1}.</span>
                      <span>"{q}"</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
