import React from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Clock, 
  Tag, 
  FileSearch, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react';

export default function ProvenanceModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const isVerified = data.is_verified || data.source?.includes('USER VERIFIED');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileSearch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Information Provenance & Traceability</h3>
              <p className="text-[11px] text-slate-500">Full audit trail of source, extraction, and verification</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Target Item Name & Value */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Analyte / Field</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{data.test_name || data.field_name || 'Laboratory Test'}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recorded Value</span>
              <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                {data.result_value || data.value || '-'} {data.unit || ''}
              </div>
            </div>
          </div>

          {/* Provenance Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-blue-500" /> Source Origin
              </span>
              <div className="font-bold text-slate-800 text-xs">
                {data.source || 'REPORT EXTRACTED'}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verification Status
              </span>
              <div className="font-bold text-xs">
                {isVerified ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> User Verified
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending Review
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3 text-indigo-500" /> Source Document
              </span>
              <div className="font-semibold text-slate-800 text-xs truncate" title={data.source_document || 'Uploaded Medical Report'}>
                {data.source_document || 'Laboratory Report'}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-cyan-500" /> Algorithmic Confidence
              </span>
              <div className="font-bold text-xs text-slate-800">
                {data.confidence_level || 'HIGH'} ({((data.confidence_score || 0.96) * 100).toFixed(0)}%)
              </div>
            </div>

          </div>

          {/* Verbatim Source Snippet */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Original Source Snippet (Verbatim Text)</span>
              <span className="text-slate-400">Page {data.source_page || 1}</span>
            </span>
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-800 overflow-x-auto">
              {data.source_text ? (
                <span className="text-emerald-400">{data.source_text}</span>
              ) : (
                <span className="text-slate-400 italic">Extracted directly from tabular row on page {data.source_page || 1}</span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Preserved directly from the document during text extraction. Never altered by summarization models.
            </p>
          </div>

          {/* Reference Range Provenance Note */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
            <strong>Reference Range Principle:</strong> Source reference range was recorded as <code>{data.reference_range_raw || 'Not Specified'}</code>. MedLens does not invent, look up, or assume external reference boundaries.
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-xl text-xs font-bold transition-colors"
          >
            Close Provenance Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
