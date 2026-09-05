import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCheck, 
  RefreshCw,
  FileSearch,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function ExtractionReviewQueue({ 
  setActiveTab, 
  selectedPatientId, 
  currentReport,
  onOpenProvenance 
}) {
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editRange, setEditRange] = useState('');
  const [rejectionModalId, setRejectionModalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadQueue = async () => {
    setLoading(true);
    try {
      if (currentReport?.id) {
        const data = await api.getReportResults(currentReport.id);
        setLabResults(data || []);
      } else if (selectedPatientId) {
        const data = await api.getPatient(selectedPatientId);
        setLabResults(data?.lab_results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [currentReport, selectedPatientId]);

  const handleAccept = async (id) => {
    try {
      await api.acceptLabResult(id);
      await api.verifyLabResult(id, true);
      loadQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.rejectLabResult(id, rejectionReason || 'Rejected during human review');
      setRejectionModalId(null);
      setRejectionReason('');
      loadQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptAll = async () => {
    if (currentReport?.id) {
      await api.acceptAllResults(currentReport.id);
      loadQueue();
    } else {
      for (const lab of labResults) {
        await api.verifyLabResult(lab.id, true);
      }
      loadQueue();
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditValue(item.result_value);
    setEditRange(item.reference_range_raw || '');
  };

  const handleSaveEdit = async (id) => {
    try {
      await api.updateLabResult(id, {
        result_value: editValue,
        reference_range_raw: editRange
      });
      await api.verifyLabResult(id, true);
      setEditingId(null);
      loadQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const unverifiedCount = labResults.filter(l => !l.is_verified && (l.is_accepted !== false)).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('medical-record')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Structured Record
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-bold border border-purple-200">
            {unverifiedCount} Items Need Verification
          </span>
          <button
            onClick={handleAcceptAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Accept & Verify All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Human Extraction Review Queue</h2>
              <p className="text-xs text-slate-500">
                Review and confirm extracted medical information before it becomes verified patient record
              </p>
            </div>
          </div>

          <button
            onClick={loadQueue}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Responsible AI Principle Notice */}
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-purple-900">
            <ShieldCheck className="w-4 h-4 text-purple-600" /> Human-in-the-Loop AI Principle:
          </div>
          <p>
            AI extractions are treated as provisional proposals. A clinical record only achieves <strong>USER VERIFIED</strong> status after a human reviews the extracted value against the original source snippet. Low-confidence extractions are highlighted for inspection.
          </p>
        </div>

        {/* Review Cards List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading extraction review queue...
          </div>
        ) : labResults.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Review Queue Empty</h3>
            <p className="text-xs text-slate-500">All extracted fields have been reviewed and processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {labResults.map((item) => {
              const isLowConf = item.confidence_level === 'LOW' || (item.confidence_score && item.confidence_score < 0.75);
              const isEditing = editingId === item.id;
              const isRejected = item.is_accepted === false;

              return (
                <div 
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isRejected ? 'bg-slate-50 border-slate-200 opacity-60' :
                    isLowConf ? 'bg-rose-50/30 border-rose-300 shadow-2xs' :
                    item.is_verified ? 'bg-white border-emerald-200 shadow-2xs' :
                    'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    
                    {/* Left details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{item.test_name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {item.category || 'General'}
                        </span>
                        
                        {/* Confidence Indicator */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.confidence_level === 'HIGH' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          item.confidence_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1'
                        }`}>
                          {isLowConf && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          Confidence: {item.confidence_level || 'HIGH'}
                        </span>

                        {/* Provenance Badge */}
                        <button
                          onClick={() => onOpenProvenance && onOpenProvenance(item)}
                          className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors font-medium"
                          title="Click to view full provenance"
                        >
                          <FileSearch className="w-3 h-3" /> Source Provenance
                        </button>
                      </div>

                      {/* Extracted Values (or Edit Inputs) */}
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-3 pt-2 max-w-md">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500">Value</label>
                            <input 
                              type="text" 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)} 
                              className="w-full text-xs font-bold p-1.5 border border-blue-400 rounded focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500">Reference Range</label>
                            <input 
                              type="text" 
                              value={editRange} 
                              onChange={(e) => setEditRange(e.target.value)} 
                              className="w-full text-xs font-mono p-1.5 border border-blue-400 rounded focus:outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-700 pt-1">
                          <div><strong>Extracted:</strong> <span className="font-bold text-slate-900">{item.result_value} {item.unit}</span></div>
                          <div><strong>Reference Range:</strong> {item.reference_range_raw || 'Not Specified'}</div>
                          <div>
                            <strong>Calculated:</strong> 
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                              item.status === 'LOW' ? 'bg-amber-100 text-amber-800' :
                              item.status === 'NORMAL' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Source snippet */}
                      <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 truncate max-w-xl">
                        Snippet: "{item.source_text || `${item.test_name}: ${item.result_value} ${item.unit}`}"
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                          >
                            Save & Verify
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {!item.is_verified && (
                            <button
                              onClick={() => handleAccept(item.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Verify
                            </button>
                          )}

                          <button
                            onClick={() => handleStartEdit(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>

                          <button
                            onClick={() => setRejectionModalId(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Rejection Reason Modal */}
      {rejectionModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reject Extracted Field</h3>
            <p className="text-xs text-slate-500">
              Please provide a reason for rejecting this extraction from the official patient record:
            </p>
            <input 
              type="text" 
              placeholder="e.g. OCR artifact, misread test analyte, duplicate entry"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalId(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectionModalId)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg font-bold shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
