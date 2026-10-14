import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Filter,
  Calendar,
  Layers,
  Droplets,
  TrendingDown,
  CheckCircle2,
  PlusCircle,
  Clock
} from 'lucide-react';
import {
  DailyTrendPoint,
  LocationUsage,
  BeforeAfterComparison,
  WaterUsageRecord
} from '../types.ts';

interface ConsumptionAnalyticsProps {
  dailyTrend: DailyTrendPoint[];
  byLocation: LocationUsage[];
  availableLocations: string[];
  comparison: BeforeAfterComparison | null;
  records: WaterUsageRecord[];
  daysFilter: number;
  locationFilter: string;
  dataTypeFilter: string;
  onChangeDays: (days: number) => void;
  onChangeLocation: (loc: string) => void;
  onChangeDataType: (dt: string) => void;
  onOpenRecordModal: () => void;
}

export const ConsumptionAnalytics: React.FC<ConsumptionAnalyticsProps> = ({
  dailyTrend,
  byLocation,
  availableLocations,
  comparison,
  records,
  daysFilter,
  locationFilter,
  dataTypeFilter,
  onChangeDays,
  onChangeLocation,
  onChangeDataType,
  onOpenRecordModal,
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'records'>('trends');

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Days Filter (7 vs 30 days) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => onChangeDays(7)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                daysFilter === 7 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => onChangeDays(30)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                daysFilter === 30 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={locationFilter}
              onChange={(e) => onChangeLocation(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1677C8]"
            >
              <option value="all">All Locations (Aggregate)</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Dataset Type Filter */}
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dataTypeFilter}
              onChange={(e) => onChangeDataType(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1677C8]"
            >
              <option value="all">All Datasets</option>
              <option value="actual">Actual Sensor Readings</option>
              <option value="illustrative">Illustrative Baseline Data</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenRecordModal}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1677C8] hover:bg-[#125ea0] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Record New Measurement</span>
        </button>
      </div>

      {/* Main Grid: Chart A (Daily Consumption) & Chart B (Before & After) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart A: Daily Water Consumption Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#1677C8]" />
                Daily Water Consumption ({daysFilter} Days)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Volumetric consumption tracking in Litres for{' '}
                <span className="font-semibold text-slate-700">
                  {locationFilter === 'all' ? 'All Monitored Zones' : locationFilter}
                </span>
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(val) => {
                      const p = val.split('-');
                      return p.length === 3 ? `${p[1]}/${p[2]}` : val;
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
                        const row = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg">
                            <span className="text-slate-400 block mb-1">{row.date}</span>
                            <span className="font-mono font-bold text-base text-[#1677C8]">
                              {Number(row.total_litres).toLocaleString()} Litres
                            </span>
                            <span className="text-[11px] text-slate-300 block mt-0.5">
                              {locationFilter === 'all' ? 'All facilities combined' : locationFilter}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_litres"
                    name="Litres Used"
                    stroke="#1677C8"
                    strokeWidth={2.5}
                    dot={{ fill: '#1677C8', r: 3.5, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#1677C8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No consumption records match the selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Chart B: Before-and-After Comparison */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Intervention Audit
              </span>
              <span className="text-xs font-mono font-semibold text-[#1677C8]">
                Standardized Periods
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Before & After Comparison
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Comparing initial baseline period with current flow after repairs and aerator installations.
            </p>

            {comparison?.hasComparison ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                    <span>Baseline Period:</span>
                    <span className="font-mono text-slate-700">{comparison.baselinePeriod}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-medium text-slate-700">Baseline Daily Usage:</span>
                    <span className="text-base font-bold font-mono text-slate-800">
                      {comparison.baselineAvg.toLocaleString()} L
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#EAF6FF]/70 rounded-lg border border-[#1677C8]/20">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                    <span>Conservation Period:</span>
                    <span className="font-mono text-slate-700">{comparison.currentPeriod}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-medium text-[#1677C8]">Current Daily Usage:</span>
                    <span className="text-base font-bold font-mono text-[#1677C8]">
                      {comparison.currentAvg.toLocaleString()} L
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-[#43A66B]">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-2xl font-bold font-mono">
                      {comparison.percentageReduction}% Reduction
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 block mt-1">
                    Conserving ~{comparison.litresSaved.toLocaleString()} Litres Every Day
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-600 block">
                  Awaiting measurements
                </span>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                  Per strict scientific standards, comparisons require at least 8 distinct days of data before reduction percentages are calculated.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-400">
            Observation periods are symmetrically normalized.
          </div>
        </div>
      </div>

      {/* Chart C: Water Usage by Location & Detailed Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart C: Location Distribution */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Water Usage by Location (Litres)
              </h3>
              <p className="text-xs text-slate-500">
                Distribution across washrooms, cafeteria, grounds, and specialty zones
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              Ranked by consumption
            </span>
          </div>

          <div className="h-64 w-full">
            {byLocation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byLocation}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(val) => `${val}L`}
                  />
                  <YAxis
                    type="category"
                    dataKey="location"
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    width={130}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const loc = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg">
                            <span className="text-slate-400 block mb-0.5">{loc.location}</span>
                            <span className="font-mono font-bold text-base text-[#EAF6FF]">
                              {Number(loc.total_litres).toLocaleString()} Litres
                            </span>
                            <span className="text-[11px] text-slate-300 block mt-0.5">
                              {loc.measurements_count} recorded sub-meter readings
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="total_litres"
                    name="Litres"
                    fill="#1677C8"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No location data found.
              </div>
            )}
          </div>
        </div>

        {/* Tabular Data View Toggle / Mini Record Audit */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Audit Records</h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {records.length} logged
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {records.slice(0, 5).map((rec) => (
                <div
                  key={rec.id}
                  className="p-2.5 rounded-lg border border-slate-100 bg-[#F8FAFC] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800 block">{rec.location}</span>
                    <span className="text-[11px] text-slate-500">
                      {rec.date} · {rec.measurement_method}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900">
                      {Number(rec.litres_used).toLocaleString()} L
                    </span>
                    <span
                      className={`block text-[10px] font-semibold ${
                        rec.data_type === 'actual' ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {rec.data_type === 'actual' ? 'Actual' : 'Illustrative'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRecordModal}
            className="w-full mt-4 py-2 text-xs font-semibold text-[#1677C8] bg-blue-50/70 hover:bg-blue-100 rounded-lg transition-colors"
          >
            + Add New Log Entry
          </button>
        </div>
      </div>
    </div>
  );
};
