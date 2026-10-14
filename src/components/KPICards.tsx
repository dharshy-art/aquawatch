import React, { useState } from 'react';
import { Droplets, TrendingDown, TrendingUp, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { KPIData } from '../types.ts';

interface KPICardsProps {
  kpis: KPIData | null;
  onOpenScoreDetails: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis, onOpenScoreDetails }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  if (!kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 p-5 animate-pulse" />
        ))}
      </div>
    );
  }

  const { totalConsumption, waterSaved, leaksDetected, conservationScore } = kpis;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Water Consumption */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">
              Total Consumption
            </span>
            <div className="relative">
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                onMouseEnter={() => setActiveTooltip('consumption')}
                onMouseLeave={() => setActiveTooltip(null)}
                aria-label="Consumption details"
              >
                <Info className="w-4 h-4" />
              </button>
              {activeTooltip === 'consumption' && (
                <div className="absolute right-0 top-6 z-20 w-56 p-2 bg-slate-900 text-white text-xs rounded-md shadow-lg pointer-events-none">
                  {totalConsumption.tooltip}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {totalConsumption.value.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">L / day</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {totalConsumption.trendPercent !== null ? (
            <div
              className={`flex items-center gap-1 font-medium ${
                totalConsumption.trendPercent <= 0 ? 'text-[#43A66B]' : 'text-amber-600'
              }`}
            >
              {totalConsumption.trendPercent <= 0 ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              <span>
                {totalConsumption.trendPercent > 0 ? `+${totalConsumption.trendPercent}%` : `${totalConsumption.trendPercent}%`}
              </span>
              <span className="text-slate-400 font-normal">vs yesterday</span>
            </div>
          ) : (
            <span className="text-slate-400">Baseline tracking</span>
          )}
          <span className="text-slate-400 font-mono text-[11px]">Sub-metered</span>
        </div>
      </div>

      {/* 2. Water Saved */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">
              Water Saved
            </span>
            <div className="relative">
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                onMouseEnter={() => setActiveTooltip('saved')}
                onMouseLeave={() => setActiveTooltip(null)}
                aria-label="Water saved details"
              >
                <Info className="w-4 h-4" />
              </button>
              {activeTooltip === 'saved' && (
                <div className="absolute right-0 top-6 z-20 w-56 p-2 bg-slate-900 text-white text-xs rounded-md shadow-lg pointer-events-none">
                  {waterSaved.tooltip}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#43A66B] font-mono">
              +{waterSaved.value.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">L / day</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {waterSaved.percentageReduction !== null && waterSaved.baselineDailyAvg > 0 ? (
            <div className="flex items-center gap-1 font-semibold text-[#43A66B]">
              <Droplets className="w-3.5 h-3.5" />
              <span>{waterSaved.percentageReduction}% saved</span>
              <span className="text-slate-400 font-normal">vs baseline</span>
            </div>
          ) : (
            <span className="text-slate-400">Awaiting baseline calibration</span>
          )}
          <span className="text-slate-400 font-mono text-[11px]">Conserved</span>
        </div>
      </div>

      {/* 3. Leaking Taps Detected */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">
              Leaking Taps Detected
            </span>
            <div className="relative">
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                onMouseEnter={() => setActiveTooltip('leaks')}
                onMouseLeave={() => setActiveTooltip(null)}
                aria-label="Leak details"
              >
                <Info className="w-4 h-4" />
              </button>
              {activeTooltip === 'leaks' && (
                <div className="absolute right-0 top-6 z-20 w-56 p-2 bg-slate-900 text-white text-xs rounded-md shadow-lg pointer-events-none">
                  {leaksDetected.tooltip}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold font-mono ${
                leaksDetected.activeCount > 0 ? 'text-amber-600' : 'text-slate-900'
              }`}
            >
              {leaksDetected.activeCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Active leaks</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-600">
            {leaksDetected.activeCount > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-medium text-slate-700">{leaksDetected.verifiedCount} verified</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#43A66B]" />
                <span className="text-[#43A66B] font-medium">All clear</span>
              </>
            )}
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {leaksDetected.resolvedCount} resolved
          </span>
        </div>
      </div>

      {/* 4. Water Conservation Score */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative flex flex-col justify-between hover:border-[#1677C8] transition-colors cursor-pointer group" onClick={onOpenScoreDetails}>
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">
              Conservation Score
            </span>
            <span className="text-[11px] text-[#1677C8] group-hover:underline font-medium">
              View formula
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            {conservationScore.score !== null ? (
              <>
                <span className="text-3xl font-bold text-[#1677C8] font-mono">
                  {conservationScore.score}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ 100</span>
              </>
            ) : (
              <span className="text-lg font-semibold text-slate-400">
                Insufficient data
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#1677C8]" />
            <span className="truncate max-w-[150px]">{conservationScore.grade}</span>
          </div>
          <span className="text-[#1677C8] font-mono text-[11px]">Weighted index</span>
        </div>
      </div>
    </div>
  );
};
