import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FileSearch,
  CheckSquare
} from 'lucide-react';
import { api } from '../services/api';

export default function StructuredRecordView({ 
  setActiveTab, 
  selectedPatientId, 
  currentReport, 
  setSelectedLabResult,
  onOpenProvenance 
}) {
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ABNORMAL' | 'UNKNOWN' | 'UNVERIFIED'

  const loadResults = async () => {
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
    loadResults();
  }, [currentReport, selectedPatientId]);

  // Filter and search logic
  const filteredResults = labResults.filter(item => {
    const matchesSearch = item.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    if (statusFilter === 'ABNORMAL') {
      return item.status === 'HIGH' || item.status === 'LOW';
    }
    if (statusFilter === 'UNKNOWN') {
      return item.status === 'UNKNOWN' || item.status === 'NOT ASSESSABLE' || item.status === 'NOT_DETERMINED';
    }
    if (statusFilter === 'UNVERIFIED') {
      return !item.is_verified;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'HIGH':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">HIGH</span>;
      case 'LOW':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">LOW</span>;
      case 'NORMAL':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">NORMAL</span>;
      case 'UNKNOWN':
      case 'NOT ASSESSABLE':
      case 'NOT_DETERMINED':
        return (
          <span 
            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 cursor-help"
            title="Reference range not provided in source report"
          >
            UNKNOWN
          </span>
        );
      case 'POSITIVE':
      case 'REACTIVE':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">{status}</span>;
      case 'NEGATIVE':
      case 'NON-REACTIVE':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">{status}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">{status}</span>;
    }
  };

  const handleOpenVerify = (lab) => {
    if (setSelectedLabResult) {
      setSelectedLabResult(lab);
    }
    setActiveTab('verification');
  };

  const unverifiedCount = labResults.filter(l => !l.is_verified).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadResults}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh results"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setActiveTab('review-queue')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Review Queue ({unverifiedCount})
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            AI Summary
          </button>

          <a
            href={api.getPatientPdfUrl(selectedPatientId || 1)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Clinical PDF
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Structured Medical Record</h2>
              <p className="text-xs text-slate-500">Evaluated deterministically strictly using source report reference intervals</p>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong>{filteredResults.length}</strong> of {labResults.length} tests
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search test name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Tests
            </button>
            <button
              onClick={() => setStatusFilter('ABNORMAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'ABNORMAL' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Abnormal (HIGH/LOW)
            </button>
            <button
              onClick={() => setStatusFilter('UNKNOWN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'UNKNOWN' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Missing Range (UNKNOWN)
            </button>
            <button
              onClick={() => setStatusFilter('UNVERIFIED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'UNVERIFIED' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Needs Verification
            </button>
          </div>
        </div>

        {/* Lab Table */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading structured results from database...
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No laboratory results match the selected criteria.</p>
            <p className="text-[11px] text-slate-500">Upload a report or select another filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Test Analyte</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Source Reference Range</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Provenance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.test_name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{item.category || 'General'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {item.result_value} <span className="font-normal text-slate-500 text-[11px]">{item.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {item.reference_range_raw || (
                        <span className="text-slate-400 italic text-[11px]">Not provided in report</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onOpenProvenance && onOpenProvenance(item)}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors font-medium"
                        title="Click to view full provenance and verbatim source snippet"
                      >
                        <FileSearch className="w-3 h-3" />
                        {item.is_verified ? 'Verified' : 'Extracted'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenVerify(item)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Verify / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Responsible AI Guarantee Box */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Deterministic Reference Range Assurance:</strong> MedLens evaluates status strictly using the range printed in the source document. If no reference range is provided, status is labeled <strong>UNKNOWN</strong> (never looked up on the internet or assumed).
          </span>
        </div>
      </div>
    </div>
  );
}
