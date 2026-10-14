import React, { useState } from 'react';
import { X, AlertCircle, Droplets, CheckCircle2 } from 'lucide-react';
import { createWasteReport } from '../services/api.ts';

interface ReportWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportWasteModal: React.FC<ReportWasteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [location, setLocation] = useState('');
  const [wasteType, setWasteType] = useState('Leaking taps');
  const [description, setDescription] = useState('');
  const [reportedAt, setReportedAt] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [estimatedLoss, setEstimatedLoss] = useState('');
  const [status, setStatus] = useState('Reported');
  const [verified, setVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError('Please specify the location of the incident.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a brief description.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createWasteReport({
        location: location.trim(),
        waste_type: wasteType,
        description: description.trim(),
        reported_at: new Date(reportedAt).toISOString(),
        estimated_loss_litres: estimatedLoss ? parseFloat(estimatedLoss) : 0,
        status,
        verified
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit waste incident report.');
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
            <Droplets className="w-5 h-5 text-[#43A66B]" />
            <h2 className="text-base font-semibold">Report Water Waste Incident</h2>
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
              Location *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Science Wing 2nd Floor Sink, Sports Field Spigot, Home Kitchen"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Waste Category *
              </label>
              <select
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8] bg-white"
              >
                <option value="Leaking taps">Leaking taps</option>
                <option value="Taps left running">Taps left running</option>
                <option value="Excessive garden watering">Excessive garden watering</option>
                <option value="Overflow and spillage">Overflow and spillage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={reportedAt}
                onChange={(e) => setReportedAt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe what you observed (e.g. continuous fast dripping, valve handle loose, hose running unattended)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Estimated Water Loss (Litres)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Optional (e.g. 15)"
                value={estimatedLoss}
                onChange={(e) => setEstimatedLoss(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8] font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Rule of thumb: 1 drip/sec ≈ 20–30 L/day
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8] bg-white"
              >
                <option value="Reported">Reported</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Verification safeguard rule */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1677C8] focus:ring-[#1677C8]"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">Verified by Teacher or Maintenance Staff</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Per AquaWatch guidelines: Reports remain unverified until inspected on-site.
                </p>
              </div>
            </label>
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
              <span>{isSubmitting ? 'Submitting...' : 'Save Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
