import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  RefreshCw, 
  UserCheck, 
  FileText, 
  HelpCircle,
  ShieldAlert,
  Check,
  Edit2
} from 'lucide-react';
import { api } from '../services/api';

export default function ConflictResolutionView({ setActiveTab, selectedPatientId }) {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [customInputs, setCustomInputs] = useState({});

  const loadConflicts = async () => {
    setLoading(true);
    try {
      const patientId = selectedPatientId || 1;
      const data = await api.getConflicts(patientId);
      setConflicts(data || []);
    } catch (err) {
      console.error("Failed to load conflicts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflicts();
  }, [selectedPatientId]);

  const handleResolve = async (conflictId, resolution, customVal = null) => {
    setResolvingId(conflictId);
    try {
      await api.resolveConflict(conflictId, resolution, customVal);
      await loadConflicts();
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  const pendingConflicts = conflicts.filter(c => c.status === 'PENDING');
  const resolvedConflicts = conflicts.filter(c => c.status === 'RESOLVED');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs bg-amber-50 text-amber-800 px-3 py-1 rounded-full font-bold border border-amber-200 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          {pendingConflicts.length} Active Discrepancies
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Information Conflict & Inconsistency Detection</h2>
              <p className="text-xs text-slate-500">
                Automated detection of mismatches between manual user intake and extracted report data
              </p>
            </div>
          </div>

          <button
            onClick={loadConflicts}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            title="Scan for new conflicts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Responsible AI Principle Notice */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
          <div className="font-bold text-slate-800">Inconsistency Resolution Rule:</div>
          <p>
            MedLens detects contradictions but <strong>never automatically assumes</strong> which source is medically or administratively correct. The reviewing human clinician or patient must explicitly decide how to resolve each item.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Analyzing patient record for inconsistencies...
          </div>
        ) : conflicts.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Discrepancies Detected</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All intake demographics, reported medications, and extracted laboratory data are completely aligned.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Pending Conflicts Section */}
            {pendingConflicts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Active Conflicts Awaiting Human Resolution ({pendingConflicts.length})
                </h3>

                <div className="space-y-4">
                  {pendingConflicts.map(c => (
                    <div 
                      key={c.id}
                      className="border border-amber-200 bg-amber-50/20 rounded-2xl p-5 space-y-4 shadow-2xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            {c.conflict_type.replace('_', ' ')}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1.5">{c.title}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">{c.description}</p>
                        </div>
                      </div>

                      {/* Side-by-Side Values */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-blue-500" /> {c.source_a_label}
                          </span>
                          <div className="font-mono font-bold text-slate-900 text-sm">{c.source_a_value}</div>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <FileText className="w-3 h-3 text-indigo-500" /> {c.source_b_label}
                          </span>
                          <div className="font-mono font-bold text-slate-900 text-sm">{c.source_b_value}</div>
                        </div>
                      </div>

                      {/* Resolution Buttons */}
                      <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-600 mr-1">Choose Resolution:</span>
                        
                        <button
                          onClick={() => handleResolve(c.id, 'KEEP_A')}
                          disabled={resolvingId === c.id}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        >
                          Keep User Intake ({c.source_a_value})
                        </button>

                        <button
                          onClick={() => handleResolve(c.id, 'KEEP_B')}
                          disabled={resolvingId === c.id}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        >
                          Update to Match Report ({c.source_b_value})
                        </button>

                        <button
                          onClick={() => handleResolve(c.id, 'DISMISSED')}
                          disabled={resolvingId === c.id}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                        >
                          Dismiss (Non-Critical)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Conflicts Section */}
            {resolvedConflicts.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Resolved Discrepancies ({resolvedConflicts.length})
                </h3>

                <div className="space-y-2">
                  {resolvedConflicts.map(c => (
                    <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{c.title}</div>
                        <div className="text-[11px] text-slate-500">{c.description}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {c.resolution}
                        </span>
                      </div>
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
