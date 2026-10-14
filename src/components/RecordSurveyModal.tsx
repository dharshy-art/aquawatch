import React, { useState } from 'react';
import { X, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createSurvey } from '../services/api.ts';

interface RecordSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordSurveyModal: React.FC<RecordSurveyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [surveyDate, setSurveyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [totalResponses, setTotalResponses] = useState('');
  const [tapsRunning, setTapsRunning] = useState('');
  const [longShowers, setLongShowers] = useState('');
  const [waterReuse, setWaterReuse] = useState('');
  const [dataType, setDataType] = useState<'actual' | 'illustrative'>('actual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const total = parseInt(totalResponses) || 0;
  const taps = parseInt(tapsRunning) || 0;
  const showers = parseInt(longShowers) || 0;
  const reuse = parseInt(waterReuse) || 0;

  // Live preview percentage calculation
  const tapsPct = total > 0 ? ((taps / total) * 100).toFixed(1) : '0.0';
  const showersPct = total > 0 ? ((showers / total) * 100).toFixed(1) : '0.0';
  const reusePct = total > 0 ? ((reuse / total) * 100).toFixed(1) : '0.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (total <= 0) {
      setError('Total respondents must be at least 1.');
      return;
    }
    if (taps > total || showers > total || reuse > total) {
      setError('Habit respondent count cannot exceed total respondents.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createSurvey({
        survey_date: surveyDate,
        total_responses: total,
        taps_running_count: taps,
        long_showers_count: showers,
        water_reuse_count: reuse,
        data_type: dataType
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit survey.');
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
            <Users className="w-5 h-5 text-[#43A66B]" />
            <h2 className="text-base font-semibold">Enter Student Habit Survey Results</h2>
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
                Survey Date *
              </label>
              <input
                type="date"
                required
                value={surveyDate}
                onChange={(e) => setSurveyDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Total Valid Respondents *
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 25"
                value={totalResponses}
                onChange={(e) => setTotalResponses(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1677C8] font-mono"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Observed Habit Counts (Self-Reported or Audited)
            </span>

            {/* Habit 1 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex-1">
                <span className="text-xs font-medium text-slate-900 block">
                  Leave taps running while washing hands / brushing
                </span>
                <span className="text-[11px] text-slate-500">
                  Live calculation: <strong className="font-mono text-[#1677C8]">{tapsPct}%</strong> ({taps} of {total || 0})
                </span>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  max={total || 9999}
                  required
                  placeholder="Count"
                  value={tapsRunning}
                  onChange={(e) => setTapsRunning(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1677C8] font-mono text-right"
                />
              </div>
            </div>

            {/* Habit 2 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex-1">
                <span className="text-xs font-medium text-slate-900 block">
                  Take long showers (&gt; 10 minutes)
                </span>
                <span className="text-[11px] text-slate-500">
                  Live calculation: <strong className="font-mono text-[#1677C8]">{showersPct}%</strong> ({showers} of {total || 0})
                </span>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  max={total || 9999}
                  required
                  placeholder="Count"
                  value={longShowers}
                  onChange={(e) => setLongShowers(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1677C8] font-mono text-right"
                />
              </div>
            </div>

            {/* Habit 3 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex-1">
                <span className="text-xs font-medium text-slate-900 block">
                  Regularly reuse water (e.g. for plants, mopping)
                </span>
                <span className="text-[11px] text-slate-500">
                  Live calculation: <strong className="font-mono text-[#43A66B]">{reusePct}%</strong> ({reuse} of {total || 0})
                </span>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  max={total || 9999}
                  required
                  placeholder="Count"
                  value={waterReuse}
                  onChange={(e) => setWaterReuse(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1677C8] font-mono text-right"
                />
              </div>
            </div>
          </div>

          {/* Data classification */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Dataset Type
            </span>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-md border border-slate-200 bg-white cursor-pointer hover:border-[#1677C8]">
                <input
                  type="radio"
                  name="survey_data_type"
                  value="actual"
                  checked={dataType === 'actual'}
                  onChange={() => setDataType('actual')}
                  className="text-[#1677C8] focus:ring-[#1677C8]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">Actual Responses</span>
                  <span className="text-slate-500 text-[11px]">Real classroom survey</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-md border border-slate-200 bg-white cursor-pointer hover:border-[#1677C8]">
                <input
                  type="radio"
                  name="survey_data_type"
                  value="illustrative"
                  checked={dataType === 'illustrative'}
                  onChange={() => setDataType('illustrative')}
                  className="text-[#1677C8] focus:ring-[#1677C8]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">Illustrative Demo</span>
                  <span className="text-slate-500 text-[11px]">Demo study profile</span>
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
              <span>{isSubmitting ? 'Submitting...' : 'Save Survey Data'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
