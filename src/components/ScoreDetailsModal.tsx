import React from 'react';
import { X, Award, CheckCircle, AlertTriangle, FileText, BarChart3, HelpCircle } from 'lucide-react';
import { ScoreIndicator } from '../types.ts';

interface ScoreDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number | null;
  status: string;
  grade: string;
  indicators: ScoreIndicator[];
}

export const ScoreDetailsModal: React.FC<ScoreDetailsModalProps> = ({
  isOpen,
  onClose,
  score,
  status,
  grade,
  indicators,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#12304A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#43A66B]" />
            <div>
              <h2 className="text-base font-semibold">Water Conservation Score Methodology</h2>
              <p className="text-xs text-slate-300">Transparent 0–100 Weighted Environmental Index</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-1 rounded-md"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Score Summary Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">
                Overall Index Rating
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                {score !== null ? (
                  <>
                    <span className="text-4xl font-bold font-mono text-[#1677C8]">{score}</span>
                    <span className="text-sm font-semibold text-slate-500">/ 100</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-amber-600">Insufficient Data</span>
                )}
              </div>
              <span className="text-xs font-medium text-slate-700 mt-1 block">
                Classification: <strong className="text-slate-900">{grade}</strong>
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block mb-1">Evaluation Status</span>
              {score !== null ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Calibrated
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Baseline Missing
                </span>
              )}
            </div>
          </div>

          {/* Mathematical Formula Explanation */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#1677C8]" />
              Mathematical Composition
            </h3>
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 leading-relaxed bg-[#F8FAFC]">
              Score = (35% × Water Reduction) + (25% × Leak Resolution Rate) + (20% × Inspection Compliance) + (20% × Habit Survey Engagement)
            </div>
          </div>

          {/* Indicators Breakdown Table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#1677C8]" />
              Indicator Weights & Target Benchmarks
            </h3>

            <div className="space-y-3">
              {indicators.map((ind, idx) => {
                const pctOfWeight = ind.weight > 0 ? (ind.achieved / ind.weight) * 100 : 0;
                return (
                  <div key={idx} className="p-3.5 border border-slate-200 rounded-xl bg-white shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-sm font-semibold text-slate-900">{ind.name}</span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {ind.details || ind.status || 'Active indicator'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-slate-900">
                          {ind.achieved} <span className="text-xs text-slate-500 font-normal">/ {ind.weight} pts</span>
                        </span>
                        <span className="block text-[11px] text-slate-500">Weight: {ind.weight}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
                      <div
                        className="bg-[#1677C8] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, pctOfWeight))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Academic Integrity & Absence Safeguard Note */}
          <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-slate-700 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-[#1677C8] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-900 block">Rigorous Academic Standard</span>
              <p className="text-slate-600 leading-normal">
                AquaWatch enforces mathematical transparency. If fewer than 2 verifiable indicators are populated in the SQLite database, arbitrary scoring is strictly prevented and &ldquo;Insufficient data&rdquo; is presented until valid readings are entered.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
