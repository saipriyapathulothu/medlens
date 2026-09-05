import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs sm:text-sm text-amber-900 flex items-center justify-center gap-2 font-medium shadow-sm">
      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <span>
        <strong>Responsible AI Notice:</strong> MedLens is an information organization and summarization tool. It does not provide medical diagnosis, prescribe medication, recommend dosage changes, or replace professional medical advice.
      </span>
    </div>
  );
}
