import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ArrowLeft, 
  UserCheck, 
  UploadCloud, 
  CheckCircle2, 
  FileText, 
  Download, 
  Edit3, 
  History 
} from 'lucide-react';
import { api } from '../services/api';

export default function TimelineView({ setActiveTab, selectedPatientId }) {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const patientId = selectedPatientId || 1;
        const data = await api.getTimeline(patientId);
        setTimelineEvents(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [selectedPatientId]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'INTAKE_CREATED':
      case 'INTAKE_UPDATED':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'REPORT_UPLOADED':
        return <UploadCloud className="w-4 h-4 text-indigo-600" />;
      case 'REPORT_PROCESSED':
        return <History className="w-4 h-4 text-cyan-600" />;
      case 'RESULT_VERIFIED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'RESULT_EDITED':
        return <Edit3 className="w-4 h-4 text-amber-600" />;
      case 'SUMMARY_GENERATED':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'PDF_EXPORTED':
        return <Download className="w-4 h-4 text-slate-700" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
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
        <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-semibold border border-purple-200">
          Audit Trail & Data Provenance
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Patient Provenance Timeline</h2>
            <p className="text-xs text-slate-500">Immutable chronological log of all ingestion, extraction, human edit, and verification events</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading patient audit trail...
          </div>
        ) : timelineEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No audit records found yet for this patient. Actions like saving intake, uploading reports, and verifying results will appear here automatically.
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative group">
                {/* Dot / Icon */}
                <div className="absolute -left-[33px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-500 flex items-center justify-center shadow-xs transition-colors">
                  {getActionIcon(evt.action)}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 group-hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {evt.action.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-normal">
                    {evt.details}
                  </p>

                  {evt.changes && (
                    <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                      <code>{JSON.stringify(evt.changes)}</code>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
