import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportComparisonView({ setActiveTab, selectedPatientId }) {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      setLoading(true);
      try {
        const patientId = selectedPatientId || 1;
        const data = await api.getComparison(patientId);
        setComparisonData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, [selectedPatientId]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('medical-record')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Structured Record
        </button>
        <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold border border-indigo-200">
          Historical Trend & Delta Analysis
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Report Comparison & Trajectory</h2>
              <p className="text-xs text-slate-500">Tracks changes across consecutive medical lab reports for this patient</p>
            </div>
          </div>

          {comparisonData?.has_comparison && (
            <div className="flex items-center gap-3 text-xs bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Previous: {comparisonData.previous_report_date}</span>
              <span>&rarr;</span>
              <span>Current: {comparisonData.current_report_date}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Comparing historical patient reports...
          </div>
        ) : !comparisonData || !comparisonData.comparisons || comparisonData.comparisons.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <GitCompare className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Need At Least 2 Reports to Compare</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please upload a second laboratory report (or use the 1-click synthetic demonstrators on the Upload screen) to see the automated delta comparisons and visual trend graphs.
            </p>
            <button
              onClick={() => setActiveTab('upload-report')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Upload Additional Report
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Visual Biomarker Trend Charts (SVG-based line graphs) */}
            {comparisonData.chart_trends && comparisonData.chart_trends.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Visual Biomarker Trajectory (Repeat Analytes)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comparisonData.chart_trends.map((trend, i) => {
                    const vals = trend.data.map(d => d.value);
                    const minVal = Math.min(...vals) * 0.9;
                    const maxVal = Math.max(...vals) * 1.1;
                    const range = (maxVal - minVal) || 1;

                    return (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{trend.test_name}</span>
                          <span className="text-[11px] font-semibold text-slate-500">{trend.unit}</span>
                        </div>

                        {/* Minimalist SVG sparkline / line chart */}
                        <div className="h-28 flex items-end justify-between px-4 pt-4 border-b border-slate-200">
                          {trend.data.map((pt, pIdx) => {
                            const heightPercent = Math.max(15, Math.min(95, ((pt.value - minVal) / range) * 100));
                            return (
                              <div key={pIdx} className="flex flex-col items-center gap-1.5 flex-1">
                                <span className="text-[10px] font-bold text-slate-700">{pt.value}</span>
                                <div 
                                  className={`w-4 rounded-t-md transition-all ${
                                    pt.status === 'HIGH' ? 'bg-rose-500' :
                                    pt.status === 'LOW' ? 'bg-amber-500' : 'bg-blue-600'
                                  }`}
                                  style={{ height: `${heightPercent}%` }}
                                />
                                <span className="text-[9px] text-slate-400 mt-1">{pt.date}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comparison Delta Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Analyte Shift & Delta Matrix
              </h3>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Test Name</th>
                      <th className="py-3 px-4">Reference Range</th>
                      <th className="py-3 px-4 text-center">Previous ({comparisonData.previous_report_date})</th>
                      <th className="py-3 px-4 text-center">Current ({comparisonData.current_report_date})</th>
                      <th className="py-3 px-4 text-center">Delta Change</th>
                      <th className="py-3 px-4 text-center">Direction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparisonData.comparisons.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">{c.test_name}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{c.reference_range || '-'}</td>
                        <td className="py-3 px-4 text-center font-mono">
                          {c.previous_value ? `${c.previous_value} ${c.unit || ''}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                          {c.current_value ? `${c.current_value} ${c.unit || ''}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {c.delta !== null ? (
                            <span className={c.delta > 0 ? 'text-blue-700' : c.delta < 0 ? 'text-indigo-700' : 'text-slate-600'}>
                              {c.delta > 0 ? `+${c.delta}` : c.delta} {c.unit || ''}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.direction === 'Increased' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            c.direction === 'Decreased' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {c.direction === 'Increased' && <TrendingUp className="w-3 h-3 text-blue-600" />}
                            {c.direction === 'Decreased' && <TrendingDown className="w-3 h-3 text-indigo-600" />}
                            {c.direction === 'Stable' && <Minus className="w-3 h-3 text-slate-500" />}
                            {c.direction}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
