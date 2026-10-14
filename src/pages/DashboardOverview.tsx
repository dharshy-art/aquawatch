import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  Droplets,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { KPIData, DailyTrendPoint, BeforeAfterComparison, WasteReport, DynamicInsight } from '../types.ts';
import { KPICards } from '../components/KPICards.tsx';
import { PageId } from '../components/Sidebar.tsx';

interface DashboardOverviewProps {
  kpis: KPIData | null;
  dailyTrend: DailyTrendPoint[];
  comparison: BeforeAfterComparison | null;
  wasteReports: WasteReport[];
  dynamicInsights: DynamicInsight[];
  onNavigate: (page: PageId) => void;
  onOpenReportModal: () => void;
  onOpenScoreDetails: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  kpis,
  dailyTrend,
  comparison,
  wasteReports,
  dynamicInsights,
  onNavigate,
  onOpenReportModal,
  onOpenScoreDetails,
}) => {
  const activeLeaks = wasteReports.filter(
    (r) => (r.waste_type === 'Leaking taps' || r.waste_type.includes('leak')) && r.status !== 'Resolved'
  );

  return (
    <div className="space-y-6">
      {/* 4 Primary Top KPI Cards */}
      <KPICards kpis={kpis} onOpenScoreDetails={onOpenScoreDetails} />

      {/* Urgent Active Leaks Banner if any exist */}
      {activeLeaks.length > 0 && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-900 block">
                {activeLeaks.length} Active Tap Leak{activeLeaks.length > 1 ? 's' : ''} Require Attention
              </span>
              <p className="text-xs text-slate-600">
                Ongoing water loss detected in {activeLeaks.map((l) => l.location).slice(0, 2).join(', ')}
                {activeLeaks.length > 2 ? ` and ${activeLeaks.length - 2} other zone(s)` : ''}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('waste')}
            className="px-3.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <span>Inspect Incidents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2-Column Grid: Water Consumption Quick Trend + Before & After Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: 7-Day Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Daily Water Consumption Timeline
              </h3>
              <p className="text-xs text-slate-500">
                Total aggregate volume across all facilities (last 7–14 days)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-[#1677C8] hover:underline flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            {dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend.slice(-7)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677C8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1677C8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(val) => {
                      const parts = val.split('-');
                      return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
                    }}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}L`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg">
                            <div className="text-slate-400 mb-1">{data.date}</div>
                            <div className="font-mono font-bold text-sm text-[#EAF6FF]">
                              {Number(data.total_litres).toLocaleString()} Litres
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_litres"
                    stroke="#1677C8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#consumptionGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No consumption records found. Click &ldquo;Record Usage&rdquo; to add your first reading.
              </div>
            )}
          </div>
        </div>

        {/* Before-and-After Comparison Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Impact Benchmark
              </span>
              <span className="text-xs font-medium text-[#43A66B] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Before vs. After Conservation
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Comparison between pre-conservation baseline and post-repair flow rates.
            </p>

            {comparison?.hasComparison ? (
              <div className="mt-5 space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Baseline Daily Avg:</span>
                  <span className="text-sm font-bold font-mono text-slate-700">
                    {comparison.baselineAvg.toLocaleString()} L
                  </span>
                </div>

                <div className="p-3 bg-[#EAF6FF]/60 rounded-lg border border-[#1677C8]/20 flex items-center justify-between">
                  <span className="text-xs text-[#1677C8] font-medium">Post-Measures Daily Avg:</span>
                  <span className="text-sm font-bold font-mono text-[#1677C8]">
                    {comparison.currentAvg.toLocaleString()} L
                  </span>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/70 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-[#43A66B] mb-0.5">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-xl font-bold font-mono">
                      -{comparison.percentageReduction}%
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 block">
                    Saving ~{comparison.litresSaved.toLocaleString()} Litres daily
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-8 p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Droplets className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-600 block">
                  Awaiting measurements
                </span>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                  Log at least 8 days of consumption to generate verifiable before-and-after reduction analytics.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Examine Location Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Dynamic Conservation Recommendations + Recent Wastage Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Rule-Based Recommendations */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#1677C8]" />
              <h3 className="text-sm font-bold text-slate-900">
                Practical Conservation Recommendations
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('recommendations')}
              className="text-xs font-semibold text-[#1677C8] hover:underline"
            >
              View All Actions
            </button>
          </div>

          <div className="space-y-3">
            {dynamicInsights.slice(0, 3).map((insight, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-[#F8FAFC] hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {insight.issue}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      insight.priority === 'High'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {insight.priority} Priority
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  {insight.recommendation}
                </p>
              </div>
            ))}

            {dynamicInsights.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                All monitoring indicators are nominal. Excellent water conservation discipline!
              </div>
            )}
          </div>
        </div>

        {/* Recent Water Waste Reports */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Recent Water Waste Incidents
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenReportModal}
                className="text-xs font-semibold text-[#1677C8] hover:underline"
              >
                + Report Waste
              </button>
              <button
                type="button"
                onClick={() => onNavigate('waste')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                All Reports
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {wasteReports.slice(0, 3).map((report) => (
              <div
                key={report.id}
                className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {report.location}
                    </span>
                    <span className="text-[10px] text-slate-500">·</span>
                    <span className="text-[11px] text-slate-500 truncate">
                      {report.waste_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">
                    {report.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                      report.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : report.status === 'In Progress'
                        ? 'bg-blue-50 text-[#1677C8] border border-blue-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {report.status}
                  </span>
                  {report.estimated_loss_litres > 0 && (
                    <span className="block text-[10px] font-mono text-slate-400 mt-1">
                      ~{report.estimated_loss_litres}L loss
                    </span>
                  )}
                </div>
              </div>
            ))}

            {wasteReports.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                No active waste incidents recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
