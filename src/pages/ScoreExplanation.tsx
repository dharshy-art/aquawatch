import React from 'react';
import {
  Award,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Scale
} from 'lucide-react';
import { ScoreIndicator } from '../types.ts';

interface ScoreExplanationProps {
  score: number | null;
  status: string;
  grade: string;
  indicators: ScoreIndicator[];
}

export const ScoreExplanation: React.FC<ScoreExplanationProps> = ({
  score,
  status,
  grade,
  indicators,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <Award className="w-4 h-4 text-[#1677C8]" />
            <span>Water Conservation Index (0–100 Scale)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Documented Environmental Scoring Standard
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            A weighted evaluation framework that combines flow meter trends, plumbing maintenance responsiveness, routine inspection diligence, and student community involvement.
          </p>
        </div>

        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[180px]">
          <span className="text-xs text-slate-500 block mb-1">Overall Conservation Score</span>
          {score !== null ? (
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold font-mono text-[#1677C8]">{score}</span>
              <span className="text-sm font-semibold text-slate-400">/ 100</span>
            </div>
          ) : (
            <span className="text-xl font-bold text-amber-600">Insufficient Data</span>
          )}
          <span className="text-xs font-semibold text-slate-700 block mt-1.5">{grade}</span>
        </div>
      </div>

      {/* Formula & Weighting Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicators.map((ind, i) => {
          const pct = ind.weight > 0 ? Math.round((ind.achieved / ind.weight) * 100) : 0;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-slate-500">Weight: {ind.weight}%</span>
                  <span className="font-mono text-slate-700 font-bold">{ind.achieved}/{ind.weight} pts</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{ind.name}</h4>
                <p className="text-xs text-slate-500 leading-normal mb-3">
                  {ind.details || ind.status || 'Active indicator measurement'}
                </p>
              </div>

              <div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1.5">
                  <div
                    className="bg-[#1677C8] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Performance</span>
                  <span>{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Technical Specification */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#1677C8]" />
          Index Scoring Methodology & Rule Specifications
        </h3>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <h5 className="font-semibold text-slate-800 mb-1">
              1. Measured Consumption Reduction (35 Points Max)
            </h5>
            <p>
              Evaluates the daily average water usage over the latest 7-day observation window against the verified pre-intervention baseline. A 20% or greater verified reduction earns the maximum 35 points. Fractional reductions receive proportional scores: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">min(35, (reduction% / 20) * 35)</code>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <h5 className="font-semibold text-slate-800 mb-1">
              2. Leak Resolution Rate (25 Points Max)
            </h5>
            <p>
              Calculated as the percentage of reported leaks successfully resolved and repaired: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">(resolved_count / total_reported) * 25</code>. If zero leaks have occurred during the monitoring period, full points are awarded for flawless plumbing maintenance.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <h5 className="font-semibold text-slate-800 mb-1">
              3. Routine Inspection Compliance (20 Points Max)
            </h5>
            <p>
              Regular physical audit checks of washroom fixtures, pre-rinse valves, and grounds irrigation systems. Reaching the target benchmark of 3 completed inspections across all facility zones earns the full 20 points.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <h5 className="font-semibold text-slate-800 mb-1">
              4. Student & Community Habit Surveys (20 Points Max)
            </h5>
            <p>
              Measures behavioral engagement and awareness campaign outreach. Achieving at least 20 documented student survey responses awards the full 20 points.
            </p>
          </div>
        </div>
      </div>

      {/* Safeguard Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block uppercase tracking-wide">
            Zero Hallucination Integrity Guarantee
          </span>
          <p className="mt-0.5 leading-relaxed">
            In compliance with project specifications, if sufficient data is not available (fewer than 2 active indicators populated), AquaWatch displays &ldquo;Insufficient data&rdquo; rather than fabricating arbitrary scores.
          </p>
        </div>
      </div>
    </div>
  );
};
