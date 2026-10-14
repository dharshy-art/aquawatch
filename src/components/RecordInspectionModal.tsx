import React, { useState } from 'react';
import { X, ClipboardCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createInspection } from '../services/api.ts';

interface RecordInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordInspectionModal: React.FC<RecordInspectionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [location, setLocation] = useState('Main Building Washrooms');
  const [inspectionDate, setInspectionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [leaksFound, setLeaksFound] = useState('0');
  const [leaksResolved, setLeaksResolved] = useState('0');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError('Please provide the inspection location.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createInspection({
        location: location.trim(),
        inspection_date: inspectionDate,
        leaks_found: parseInt(leaksFound) || 0,
        leaks_resolved: parseInt(leaksResolved) || 0,
        notes: notes.trim()
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#12304A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#43A66B]" />
            <h2 className="text-base font-semibold">Log Facility Plumbing Inspection</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-1 rounded-md"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Inspection Zone / Location *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Science Wing Boys Washroom, Main Cafeteria Kitchen, West Courtyard Irrigation"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Leaks Found
              </label>
              <input
                type="number"
                min="0"
                value={leaksFound}
                onChange={(e) => setLeaksFound(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8] font-mono text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Leaks Resolved
              </label>
              <input
                type="number"
                min="0"
                value={leaksResolved}
                onChange={(e) => setLeaksResolved(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8] font-mono text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Inspector Notes & Findings
            </label>
            <textarea
              rows={3}
              placeholder="Condition of aerators, float valves, spigot seals, drip lines, or parts replaced..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-[#1677C8] hover:bg-[#125ea0] transition-colors rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Record Inspection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
