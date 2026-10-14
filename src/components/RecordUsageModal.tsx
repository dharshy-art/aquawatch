import React, { useState } from 'react';
import { X, Gauge, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createWaterUsage } from '../services/api.ts';

interface RecordUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordUsageModal: React.FC<RecordUsageModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('Washrooms');
  const [customLocation, setCustomLocation] = useState('');
  const [litresUsed, setLitresUsed] = useState('');
  const [method, setMethod] = useState('Smart Sub-meter Sensor');
  const [dataType, setDataType] = useState<'actual' | 'illustrative'>('actual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetLocation = location === 'Other' ? customLocation.trim() : location;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLocation) {
      setError('Please provide a valid location.');
      return;
    }
    const litres = parseFloat(litresUsed);
    if (isNaN(litres) || litres < 0) {
      setError('Please enter a valid positive number of litres.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createWaterUsage({
        date,
        location: targetLocation,
        litres_used: litres,
        measurement_method: method,
        data_type: dataType
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record measurement.');
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
            <Gauge className="w-5 h-5 text-[#1677C8]" />
            <h2 className="text-base font-semibold">Record Water Consumption</h2>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Measurement Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Facility Location *
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8] bg-white"
              >
                <option value="Washrooms">Washrooms</option>
                <option value="Kitchen & Cafeteria">Kitchen & Cafeteria</option>
                <option value="Garden & Grounds">Garden & Grounds</option>
                <option value="Drinking Water Station">Drinking Water Station</option>
                <option value="Laboratory & Cleaning">Laboratory & Cleaning</option>
                <option value="Home Bathroom">Home Bathroom</option>
                <option value="Home Kitchen & Laundry">Home Kitchen & Laundry</option>
                <option value="Other">Other Custom Location...</option>
              </select>
            </div>
          </div>

          {location === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Specific Custom Location *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Swimming Pool, Gymnasium Showers, Dormitory 3"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Water Volume (Litres) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                placeholder="e.g. 450"
                value={litresUsed}
                onChange={(e) => setLitresUsed(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Measurement Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8] bg-white"
              >
                <option value="Smart Sub-meter Sensor">Smart Sub-meter Sensor</option>
                <option value="Manual Sub-meter Reading">Manual Sub-meter Reading</option>
                <option value="Timed Flow Container Test">Timed Flow Container Test</option>
                <option value="Utility Water Bill Allocation">Utility Water Bill Allocation</option>
              </select>
            </div>
          </div>

          {/* Data classification integrity selector */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Data Category (Academic Integrity)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-md border border-slate-200 bg-white cursor-pointer hover:border-[#1677C8]">
                <input
                  type="radio"
                  name="data_type"
                  value="actual"
                  checked={dataType === 'actual'}
                  onChange={() => setDataType('actual')}
                  className="text-[#1677C8] focus:ring-[#1677C8]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">Actual Measurement</span>
                  <span className="text-slate-500 text-[11px]">Real meter or bucket test</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-md border border-slate-200 bg-white cursor-pointer hover:border-[#1677C8]">
                <input
                  type="radio"
                  name="data_type"
                  value="illustrative"
                  checked={dataType === 'illustrative'}
                  onChange={() => setDataType('illustrative')}
                  className="text-[#1677C8] focus:ring-[#1677C8]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">Illustrative Sample</span>
                  <span className="text-slate-500 text-[11px]">Demo or simulated test</span>
                </div>
              </label>
            </div>
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
              <span>{isSubmitting ? 'Saving...' : 'Record Measurement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
