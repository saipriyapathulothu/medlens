/**
 * MedLens API Client Service
 * --------------------------
 * Centralized HTTP request helper to interact with the FastAPI backend.
 */

const API_BASE = '/api';

export const api = {
  // Health & Diagnostics
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  getSystemStatus: async () => {
    const res = await fetch(`${API_BASE}/system-status`);
    return res.json();
  },

  // Patients
  getPatients: async () => {
    const res = await fetch(`${API_BASE}/patients`);
    return res.json();
  },

  getPatient: async (id) => {
    const res = await fetch(`${API_BASE}/patients/${id}`);
    return res.json();
  },

  createPatient: async (patientData) => {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    return res.json();
  },

  updatePatient: async (id, patientData) => {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    return res.json();
  },

  deletePatient: async (id) => {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Reports
  uploadReport: async (formData) => {
    const res = await fetch(`${API_BASE}/reports/upload`, {
      method: 'POST',
      body: formData // multipart/form-data
    });
    return res.json();
  },

  getReport: async (id) => {
    const res = await fetch(`${API_BASE}/reports/${id}`);
    return res.json();
  },

  processReport: async (id) => {
    const res = await fetch(`${API_BASE}/reports/${id}/process`, {
      method: 'POST'
    });
    return res.json();
  },

  // Lab Results & Review Queue
  getReportResults: async (reportId) => {
    const res = await fetch(`${API_BASE}/reports/${reportId}/results`);
    return res.json();
  },

  updateLabResult: async (id, updateData) => {
    const res = await fetch(`${API_BASE}/lab-results/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    return res.json();
  },

  verifyLabResult: async (id, verified = true, note = '') => {
    const res = await fetch(`${API_BASE}/lab-results/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified, clinical_note: note })
    });
    return res.json();
  },

  acceptLabResult: async (id) => {
    const res = await fetch(`${API_BASE}/lab-results/${id}/accept`, {
      method: 'POST'
    });
    return res.json();
  },

  rejectLabResult: async (id, reason) => {
    const res = await fetch(`${API_BASE}/lab-results/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  acceptAllResults: async (reportId) => {
    const res = await fetch(`${API_BASE}/reports/${reportId}/accept-all`, {
      method: 'POST'
    });
    return res.json();
  },

  // Conflicts / Inconsistencies
  getConflicts: async (patientId) => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/conflicts`);
    return res.json();
  },

  resolveConflict: async (conflictId, resolution, customValue = null, notes = '') => {
    const res = await fetch(`${API_BASE}/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution, custom_value: customValue, notes })
    });
    return res.json();
  },

  // Summaries
  generateSummary: async (patientId, reportId = null) => {
    const url = reportId 
      ? `${API_BASE}/patients/${patientId}/summary?report_id=${reportId}`
      : `${API_BASE}/patients/${patientId}/summary`;
    const res = await fetch(url, { method: 'POST' });
    return res.json();
  },

  getSummary: async (patientId) => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/summary`);
    return res.json();
  },

  // Comparison & Timeline
  getComparison: async (patientId) => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/compare`);
    return res.json();
  },

  getTimeline: async (patientId) => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/timeline`);
    return res.json();
  },

  // Demo Seeding
  seedDemoData: async () => {
    const res = await fetch(`${API_BASE}/seed-demo-data`, {
      method: 'POST'
    });
    return res.json();
  },

  // Export URLs
  getReportPdfUrl: (reportId) => `${API_BASE}/reports/${reportId}/export-pdf`,
  getPatientPdfUrl: (patientId) => `${API_BASE}/patients/${patientId}/export-pdf`,
  getPatientJsonUrl: (patientId) => `${API_BASE}/patients/${patientId}/export-json`,
  getPatientCsvUrl: (patientId) => `${API_BASE}/patients/${patientId}/export-csv`
};
