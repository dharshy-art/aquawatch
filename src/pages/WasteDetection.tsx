import React, { useState } from 'react';
import {
  AlertTriangle,
  Droplet,
  Clock,
  CheckCircle2,
  Filter,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Search
} from 'lucide-react';
import { WasteReport } from '../types.ts';
import { updateWasteReport } from '../services/api.ts';

interface WasteDetectionProps {
  reports: WasteReport[];
  categoryCounts: Record<string, number>;
  totalLossLitres: number;
  onOpenReportModal: () => void;
  onRefresh: () => void;
}

export const WasteDetection: React.FC<WasteDetectionProps> = ({
  reports,
  categoryCounts,
  totalLossLitres,
  onOpenReportModal,
  onRefresh,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);

  const categories = [
    { name: 'Leaking taps', count: categoryCounts['Leaking taps'] || 0, desc: 'Dripping faucets & seals' },
    { name: 'Taps left running', count: categoryCounts['Taps left running'] || 0, desc: 'Unattended spigots & basins' },
    { name: 'Excessive garden watering', count: categoryCounts['Excessive garden watering'] || 0, desc: 'Over-irrigation & runoff' },
    { name: 'Overflow and spillage', count: categoryCounts['Overflow and spillage'] || 0, desc: 'Tank & scullery backflow' },
  ];

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setIsUpdatingId(id);
      await updateWasteReport(id, { status: newStatus });
      onRefresh();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleVerificationToggle = async (id: number, currentVerified: number) => {
    try {
      setIsUpdatingId(id);
      await updateWasteReport(id, { verified: currentVerified === 1 ? false : true });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle verification:', err);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesCategory = selectedCategory === 'all' || r.waste_type === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const matchesSearch =
      searchQuery === '' ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 4 Category Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <div
              key={cat.name}
              onClick={() => setSelectedCategory(isSelected ? 'all' : cat.name)}
              className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                isSelected
                  ? 'border-[#1677C8] ring-1 ring-[#1677C8] shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {cat.name}
                </span>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                    cat.count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mb-1">{cat.count}</div>
              <span className="text-[11px] text-slate-500">{cat.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Aggregate Waste Banner */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Droplet className="w-5 h-5 text-[#1677C8]" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">Cumulative Loss Tracked</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-slate-900">
                ~{totalLossLitres.toLocaleString()} Litres
              </span>
              <span className="text-xs text-slate-500">estimated wasted across all reported incidents</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenReportModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#1677C8] hover:bg-[#125ea0] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Water Waste</span>
        </button>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search location or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1677C8]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 text-xs focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-[#1677C8] hover:underline flex items-center gap-1"
            >
              Clear &ldquo;{selectedCategory}&rdquo; filter
            </button>
          )}
        </div>

        <span className="text-xs font-mono text-slate-500">
          Showing {filteredReports.length} incident{filteredReports.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Incidents Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Date Reported</th>
                <th className="py-3 px-4 text-right">Est. Loss</th>
                <th className="py-3 px-4 text-center">Verified</th>
                <th className="py-3 px-4">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((report) => {
                const isVerified = report.verified === 1;
                const isUpdating = isUpdatingId === report.id;

                return (
                  <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Location */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {report.location}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-medium">{report.waste_type}</span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={report.description}>
                      {report.description}
                    </td>

                    {/* Reported At */}
                    <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(report.reported_at).toLocaleDateString()}
                    </td>

                    {/* Estimated Loss */}
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                      {report.estimated_loss_litres > 0 ? `${report.estimated_loss_litres} L` : '—'}
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleVerificationToggle(report.id, report.verified)}
                        title={isVerified ? 'Verified by staff (click to unverify)' : 'Unverified report (click to verify)'}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        {isVerified ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-[#43A66B]" />
                            <span>Verified</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                            <span>Unverified</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Status Select */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        disabled={isUpdating}
                        value={report.status}
                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-md border focus:outline-none transition-colors ${
                          report.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : report.status === 'In Progress'
                            ? 'bg-blue-50 text-[#1677C8] border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <option value="Reported">Reported</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                );
              })}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No water waste incidents match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
