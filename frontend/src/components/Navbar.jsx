import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  UserCheck, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckSquare, 
  FileText, 
  GitCompare,
  Clock,
  LayoutDashboard,
  Circle,
  AlertTriangle,
  ShieldCheck,
  Settings as SettingsIcon,
  Users
} from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  backendStatus,
  selectedPatientId,
  setSelectedPatientId 
}) {
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    api.getPatients().then(data => {
      if (Array.isArray(data)) {
        setPatientsList(data);
      }
    }).catch(() => {});
  }, [selectedPatientId, activeTab]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patient-info', label: 'Intake', icon: UserCheck },
    { id: 'upload-report', label: 'Upload', icon: UploadCloud },
    { id: 'medical-record', label: 'Lab Record', icon: FileSpreadsheet },
    { id: 'review-queue', label: 'Review Queue', icon: CheckSquare },
    { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
    { id: 'compare', label: 'Comparison', icon: GitCompare },
    { id: 'summary', label: 'AI Summary', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'responsible-ai', label: 'Safety & AI', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Landing Link */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 cursor-pointer select-none group"
            title="Go to MedLens Landing Page"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900">MedLens</span>
                <span className="text-[9px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">AI MVP</span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">Clinical Information Intelligence</p>
            </div>
          </div>

          {/* Patient Selector Dropdown */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-bold text-slate-500">Patient:</span>
            <select
              value={selectedPatientId || 1}
              onChange={(e) => setSelectedPatientId(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {patientsList.length > 0 ? (
                patientsList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} (#{p.id})
                  </option>
                ))
              ) : (
                <>
                  <option value={1}>Sarah Jenkins (Patient A)</option>
                  <option value={2}>Marcus Chen (Patient B)</option>
                </>
              )}
            </select>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Backend Status Pill */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              backendStatus === 'online'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : backendStatus === 'checking'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <Circle className={`w-2 h-2 fill-current ${
                backendStatus === 'online'
                  ? 'text-emerald-500 animate-pulse'
                  : backendStatus === 'checking'
                  ? 'text-blue-500 animate-spin'
                  : 'text-rose-500'
              }`} />
              <span className="capitalize">API: {backendStatus}</span>
            </div>
          </div>

        </div>

        {/* Mobile / Tablet Navigation Scrollbar */}
        <div className="flex xl:hidden overflow-x-auto py-2 border-t border-slate-100 gap-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
