import React, { useState, useEffect } from 'react';
import { UserCheck, Save, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function PatientInfoView({ setActiveTab, selectedPatientId, setSelectedPatientId }) {
  const [formData, setFormData] = useState({
    first_name: 'Jane',
    last_name: 'Doe',
    age: 38,
    sex: 'Female',
    date_of_birth: '1988-04-12',
    symptoms: 'Fatigue, mild dizziness upon standing',
    existing_conditions: 'Hypertension',
    allergies: 'Penicillin',
    current_medications: 'Vitamin D3 2000 IU daily',
    other_info: 'Routine 3-month follow-up'
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (selectedPatientId) {
      api.getPatient(selectedPatientId).then(data => {
        if (data && data.id) {
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            age: data.age || '',
            sex: data.sex || 'Female',
            date_of_birth: data.date_of_birth || '',
            symptoms: data.symptoms || '',
            existing_conditions: data.existing_conditions || '',
            allergies: data.allergies || '',
            current_medications: data.current_medications || '',
            other_info: data.other_info || ''
          });
        }
      }).catch(err => console.error("Could not fetch patient", err));
    }
  }, [selectedPatientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      if (selectedPatientId) {
        await api.updatePatient(selectedPatientId, formData);
      } else {
        const newPatient = await api.createPatient(formData);
        if (newPatient && newPatient.id) {
          setSelectedPatientId(newPatient.id);
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setErrorMsg('Failed to save patient profile. Ensure backend is running.');
    } finally {
      setSaving(false);
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
        <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200">
          {selectedPatientId ? `Patient ID: #${selectedPatientId}` : 'New Patient Intake'}
        </span>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Patient Intake Form</h2>
              <p className="text-xs text-slate-500">Collects baseline patient health profile and clinical context</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Patient Profile'}
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Patient intake profile saved successfully in SQLite database!</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Demographics */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            1. Demographics & Personal Identification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">First Name *</label>
              <input 
                type="text" 
                name="first_name"
                required
                value={formData.first_name} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Last Name *</label>
              <input 
                type="text" 
                name="last_name"
                required
                value={formData.last_name} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Age</label>
              <input 
                type="number" 
                name="age"
                value={formData.age} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Sex</label>
              <select 
                name="sex"
                value={formData.sex} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Intake */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            2. Medical Context & Current Intake
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Reported Symptoms</label>
              <textarea 
                rows="2"
                name="symptoms"
                value={formData.symptoms} 
                onChange={handleChange}
                placeholder="e.g. Fatigue, dizziness, shortness of breath"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Existing Conditions</label>
              <textarea 
                rows="2"
                name="existing_conditions"
                value={formData.existing_conditions} 
                onChange={handleChange}
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Known Allergies</label>
              <textarea 
                rows="2"
                name="allergies"
                value={formData.allergies} 
                onChange={handleChange}
                placeholder="e.g. Penicillin, Peanuts, Sulfa drugs"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Current Medications & Dosages</label>
              <textarea 
                rows="2"
                name="current_medications"
                value={formData.current_medications} 
                onChange={handleChange}
                placeholder="e.g. Metformin 500mg daily, Lisinopril 10mg"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-slate-700">Additional Clinical Notes</label>
              <textarea 
                rows="2"
                name="other_info"
                value={formData.other_info} 
                onChange={handleChange}
                placeholder="Extra physician or patient background notes"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <span className="text-xs text-slate-500">All intake data is securely stored in local SQLite database.</span>
          <button
            type="button"
            onClick={() => setActiveTab('upload-report')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Next: Upload Medical Report &rarr;
          </button>
        </div>
      </form>
    </div>
  );
}
