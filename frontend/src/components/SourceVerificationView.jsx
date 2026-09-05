import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  Edit3, 
  AlertCircle, 
  Check, 
  Save 
} from 'lucide-react';
import { api } from '../services/api';

export default function SourceVerificationView({ 
  setActiveTab, 
  selectedLabResult, 
  selectedPatientId,
  currentReport 
}) {
  const [lab, setLab] = useState(selectedLabResult || null);
  const [editValue, setEditValue] = useState('');
  const [editRange, setEditRange] = useState('');
  const [clinicalNote, setClinicalNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [allLabs, setAllLabs] = useState([]);

  useEffect(() => {
    if (selectedLabResult) {
      setLab(selectedLabResult);
      setEditValue(selectedLabResult.result_value || '');
      setEditRange(selectedLabResult.reference_range_raw || '');
    } else if (currentReport?.id) {
      api.getReportResults(currentReport.id).then(res => {
        if (res && res.length > 0) {
          setAllLabs(res);
          setLab(res[0]);
          setEditValue(res[0].result_value || '');
          setEditRange(res[0].reference_range_raw || '');
        }
      });
    }
  }, [selectedLabResult, currentReport]);

  const handleSelectLab = (item) => {
    setLab(item);
    setEditValue(item.result_value || '');
    setEditRange(item.reference_range_raw || '');
    setVerifiedSuccess(false);
  };

  const handleSaveAndVerify = async () => {
    if (!lab) return;
    setSaving(true);
    try {
      // 1. Update values if modified
      const updated = await api.updateLabResult(lab.id, {
        result_value: editValue,
        reference_range_raw: editRange,
        observation: clinicalNote || lab.observation
      });

      // 2. Mark verified
      const verified = await api.verifyLabResult(lab.id, true, clinicalNote);
      setLab(verified);
      setVerifiedSuccess(true);
      setTimeout(() => setVerifiedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('medical-record')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Structured Record
        </button>
        <span className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-semibold border border-teal-200">
          Side-by-Side Source Verification & Audit
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Source Provenance & Human Verification</h2>
            <p className="text-xs text-slate-500">Cross-reference extracted parameters against original source document text</p>
          </div>
        </div>

        {verifiedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Test result verified and saved to audit log! Provenance marked as verified.</span>
          </div>
        )}

        {!lab ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No lab test selected. Go back to Structured Medical Record to choose a test to verify.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Quick selector bar if multiple labs */}
            {allLabs.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Test:</span>
                {allLabs.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectLab(item)}
                    className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap font-medium transition-colors ${
                      lab.id === item.id 
                        ? 'bg-blue-600 text-white font-bold' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.test_name}
                  </button>
                ))}
              </div>
            )}

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Original Source Excerpt */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/70 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-500" />
                    Original Source Document Text
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    Page 1 Excerpt
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 font-mono text-xs text-slate-800 leading-relaxed shadow-xs">
                  <div className="text-[11px] text-slate-400 mb-2">// Verbatim excerpt from source report:</div>
                  <div className="p-2.5 bg-blue-50/60 border-l-4 border-blue-500 text-blue-950 font-semibold rounded">
                    {lab.source_text || `${lab.test_name}: ${lab.result_value} ${lab.unit} [Ref: ${lab.reference_range_raw || 'Not specified'}]`}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div><strong>Extraction Method:</strong> Automated PyMuPDF parsing with regex token matching.</div>
                  <div><strong>Confidence Score:</strong> {(lab.confidence_score * 100).toFixed(0)}% algorithmic confidence.</div>
                </div>
              </div>

              {/* Right Column: Editable & Verifiable Fields */}
              <div className="border border-teal-200 rounded-2xl p-5 bg-teal-50/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-teal-600" />
                    Human Review & Verification
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    lab.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {lab.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Test Name</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={lab.test_name} 
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Result Value</label>
                      <input 
                        type="text" 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Unit</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={lab.unit || '-'} 
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Reference Range (Exact from Report)</label>
                    <input 
                      type="text" 
                      value={editRange} 
                      onChange={(e) => setEditRange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Clinician Audit Note</label>
                    <input 
                      type="text" 
                      placeholder="Optional note e.g. 'Confirmed with paper original'" 
                      value={clinicalNote} 
                      onChange={(e) => setClinicalNote(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Calculated Status:</span>
                    <span className="font-bold text-slate-900">{lab.status}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveAndVerify}
                    disabled={saving}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {saving ? 'Verifying...' : 'Confirm & Clinically Verify Result'}
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
