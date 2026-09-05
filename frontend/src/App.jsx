import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DisclaimerBanner from './components/DisclaimerBanner';
import Dashboard from './components/Dashboard';
import LandingPageView from './components/LandingPageView';
import PatientInfoView from './components/PatientInfoView';
import UploadReportView from './components/UploadReportView';
import StructuredRecordView from './components/StructuredRecordView';
import ExtractionReviewQueue from './components/ExtractionReviewQueue';
import ConflictResolutionView from './components/ConflictResolutionView';
import SourceVerificationView from './components/SourceVerificationView';
import AISummaryView from './components/AISummaryView';
import ReportComparisonView from './components/ReportComparisonView';
import TimelineView from './components/TimelineView';
import ResponsibleAIPageView from './components/ResponsibleAIPageView';
import SettingsPageView from './components/SettingsPageView';
import ProvenanceModal from './components/ProvenanceModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing'); // Default to Landing Page for first-time orientation
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [systemData, setSystemData] = useState(null);

  // App-wide state
  const [selectedPatientId, setSelectedPatientId] = useState(1);
  const [currentReport, setCurrentReport] = useState(null);
  const [selectedLabResult, setSelectedLabResult] = useState(null);

  // Provenance Modal state
  const [provenanceModalOpen, setProvenanceModalOpen] = useState(false);
  const [provenanceData, setProvenanceData] = useState(null);

  // Check the FastAPI backend health endpoint GET /api/health
  const checkHealth = async () => {
    try {
      setBackendStatus('checking');
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok') {
          setBackendStatus('online');
          try {
            const sysJson = await api.getSystemStatus();
            setSystemData(sysJson);
          } catch (e) {}
          return;
        }
      }
      setBackendStatus('offline');
    } catch (err) {
      // Fallback: direct localhost:8000
      try {
        const directRes = await fetch('http://127.0.0.1:8000/api/health');
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData.status === 'ok') {
            setBackendStatus('online');
            return;
          }
        }
      } catch (directErr) {}
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReportProcessed = (report) => {
    setCurrentReport(report);
  };

  const handleOpenProvenance = (data) => {
    setProvenanceData(data);
    setProvenanceModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* 1. Permanent Responsible AI Disclaimer Banner */}
      <DisclaimerBanner />

      {/* 2. Main Navigation Bar with live API status & patient switcher */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        backendStatus={backendStatus}
        selectedPatientId={selectedPatientId}
        setSelectedPatientId={setSelectedPatientId}
      />

      {/* 3. Main Screen Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'landing' && (
          <LandingPageView 
            setActiveTab={setActiveTab} 
            setSelectedPatientId={setSelectedPatientId} 
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            backendStatus={backendStatus} 
            systemData={systemData}
            selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId}
          />
        )}

        {activeTab === 'patient-info' && (
          <PatientInfoView 
            setActiveTab={setActiveTab} 
            selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId}
          />
        )}

        {activeTab === 'upload-report' && (
          <UploadReportView 
            setActiveTab={setActiveTab} 
            selectedPatientId={selectedPatientId}
            onReportProcessed={handleReportProcessed}
          />
        )}

        {activeTab === 'review-queue' && (
          <ExtractionReviewQueue 
            setActiveTab={setActiveTab}
            selectedPatientId={selectedPatientId}
            currentReport={currentReport}
            onOpenProvenance={handleOpenProvenance}
          />
        )}

        {activeTab === 'medical-record' && (
          <StructuredRecordView 
            setActiveTab={setActiveTab} 
            selectedPatientId={selectedPatientId}
            currentReport={currentReport}
            setSelectedLabResult={setSelectedLabResult}
            onOpenProvenance={handleOpenProvenance}
          />
        )}

        {activeTab === 'conflicts' && (
          <ConflictResolutionView 
            setActiveTab={setActiveTab} 
            selectedPatientId={selectedPatientId}
          />
        )}

        {activeTab === 'verification' && (
          <SourceVerificationView 
            setActiveTab={setActiveTab} 
            selectedLabResult={selectedLabResult}
            selectedPatientId={selectedPatientId}
            currentReport={currentReport}
          />
        )}

        {activeTab === 'summary' && (
          <AISummaryView 
            setActiveTab={setActiveTab} 
            selectedPatientId={selectedPatientId}
            currentReport={currentReport}
          />
        )}

        {activeTab === 'compare' && (
          <ReportComparisonView 
            setActiveTab={setActiveTab} 
            selectedPatientId={selectedPatientId}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView 
            setActiveTab={setActiveTab} 
            selectedPatientId={selectedPatientId}
          />
        )}

        {activeTab === 'responsible-ai' && (
          <ResponsibleAIPageView 
            setActiveTab={setActiveTab} 
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPageView 
            setActiveTab={setActiveTab} 
            selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId}
          />
        )}

      </main>

      {/* 4. Global Provenance Modal */}
      <ProvenanceModal 
        isOpen={provenanceModalOpen}
        onClose={() => setProvenanceModalOpen(false)}
        data={provenanceData}
      />

      {/* 5. Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-700">
            MedLens — AI-Powered Clinical Information Intelligence
          </p>
          <p className="text-[11px] text-slate-400">
            Developed for Hackathon Demonstration • Synthetic Demo Data (Sarah Jenkins & Marcus Chen) • Strictly Non-Diagnostic
          </p>
        </div>
      </footer>
    </div>
  );
}
