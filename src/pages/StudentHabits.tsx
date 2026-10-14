import React, { useState } from 'react';
import {
  Users,
  AlertCircle,
  PlusCircle,
  HelpCircle,
  BarChart2,
  CheckCircle,
  Info,
  Calendar
} from 'lucide-react';
import { SurveySummary, StudentSurveyRecord } from '../types.ts';

interface StudentHabitsProps {
  surveys: StudentSurveyRecord[];
  actualSummary: SurveySummary | null;
  illustrativeSummary: SurveySummary | null;
  hasActualData: boolean;
  onOpenSurveyModal: () => void;
}

export const StudentHabits: React.FC<StudentHabitsProps> = ({
  surveys,
  actualSummary,
  illustrativeSummary,
  hasActualData,
  onOpenSurveyModal,
}) => {
  const [activeDataset, setActiveDataset] = useState<'illustrative' | 'actual'>(
    hasActualData ? 'actual' : 'illustrative'
  );

  const currentSummary = activeDataset === 'actual' ? actualSummary : illustrativeSummary;

  return (
    <div className="space-y-6">
      {/* Required Prominent Banner: Illustrative vs Actual */}
      {activeDataset === 'illustrative' ? (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
              Illustrative data — replace with actual survey responses.
            </span>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              These percentages are derived from the pre-loaded baseline survey study (20 sample participants) to demonstrate dashboard capability. Record real student classroom responses to calculate genuine school habit metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSurveyModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs"
          >
            Enter Actual Responses
          </button>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
              Actual Classroom Survey Data Active
            </span>
            <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
              Displaying aggregated findings from {actualSummary?.totalRespondents || 0} genuine student survey submissions. Percentages are dynamically calculated from verified responses.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSurveyModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs"
          >
            + Add Another Survey
          </button>
        </div>
      )}

      {/* Dataset Selector Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveDataset('illustrative')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeDataset === 'illustrative'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Illustrative Study (Sample N=20)
          </button>
          <button
            type="button"
            onClick={() => setActiveDataset('actual')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeDataset === 'actual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Actual Survey Data</span>
            {hasActualData && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenSurveyModal}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1677C8] hover:bg-[#125ea0] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Enter Survey Results</span>
        </button>
      </div>

      {/* Visual Habit Bars (Horizontal Bar Charts with Percentage Indicators) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-900">
              Student Water-Use Habits Breakdown
            </h3>
            <span className="text-xs font-mono font-medium text-slate-500">
              Total Sample: {currentSummary?.totalRespondents || 0} Students
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Self-reported behavioral patterns regarding faucet hygiene, shower duration, and water recycling.
          </p>
        </div>

        {currentSummary ? (
          <div className="space-y-6 pt-2">
            {currentSummary.habits.map((habit) => {
              const isPositive = habit.severity === 'positive';
              const isHighWastage = habit.severity === 'high';

              const barColor = isPositive
                ? 'bg-[#43A66B]'
                : isHighWastage
                ? 'bg-rose-500'
                : 'bg-amber-500';

              return (
                <div key={habit.key} className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {habit.label}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        {habit.impact}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold font-mono text-slate-900">
                        {habit.percentage}%
                      </span>
                      <span className="block text-xs font-mono text-slate-400">
                        {habit.count} out of {habit.total}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart Track */}
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, habit.percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span className="text-xs font-semibold text-slate-700 block">
              No actual survey responses recorded yet
            </span>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click &ldquo;Enter Survey Results&rdquo; to input your classroom or household questionnaire responses.
            </p>
            <button
              type="button"
              onClick={onOpenSurveyModal}
              className="mt-4 px-4 py-1.5 text-xs font-semibold text-white bg-[#1677C8] rounded-lg"
            >
              Add First Survey
            </button>
          </div>
        )}
      </div>

      {/* Reference Study Table Comparison */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-[#F8FAFC]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Study Specification Reference (Section 7 Baseline)
          </h4>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2 px-3">Water-use habit</th>
                <th className="py-2 px-3 text-right">Students</th>
                <th className="py-2 px-3 text-right">Percentage</th>
                <th className="py-2 px-3">Conservation Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">Leave taps running</td>
                <td className="py-2.5 px-3 text-right font-mono">12 out of 20</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">60%</td>
                <td className="py-2.5 px-3 text-slate-500">Install aerators; prompt with hygiene stickers</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">Take long showers (&gt;10 min)</td>
                <td className="py-2.5 px-3 text-right font-mono">8 out of 20</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600">40%</td>
                <td className="py-2.5 px-3 text-slate-500">Distribute 4-minute shower sand timers</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">Reuse water (plants, cleaning)</td>
                <td className="py-2.5 px-3 text-right font-mono">6 out of 20</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-[#43A66B]">30%</td>
                <td className="py-2.5 px-3 text-slate-500">Establish gray-water garden collection buckets</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
