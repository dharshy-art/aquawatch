import React from 'react';
import { PlusCircle, AlertTriangle, RefreshCw, Calendar, Droplets } from 'lucide-react';

interface HeaderProps {
  activePageTitle: string;
  onOpenReportModal: () => void;
  onOpenRecordModal: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activePageTitle,
  onOpenReportModal,
  onOpenRecordModal,
  onRefreshData,
  isRefreshing = false,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Zone 1: Breadcrumb & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="text-[#1677C8] flex items-center gap-1 font-semibold">
            <Droplets className="w-3.5 h-3.5" />
            AquaWatch
          </span>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold truncate">{activePageTitle}</span>
        </div>
      </div>

      {/* Zone 2: Date & Secondary Meta */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDate}</span>
        </div>
        <span aria-hidden="true" className="text-slate-200">|</span>
        <span className="text-[#43A66B] font-medium flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#43A66B]" />
          Telemetry Active
        </span>
      </div>

      {/* Zone 3: Primary Action Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onRefreshData}
          title="Refresh dashboard records"
          aria-label="Refresh dashboard data"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1677C8]' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onOpenRecordModal}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#1677C8]" />
          <span>Record Usage</span>
        </button>

        <button
          type="button"
          onClick={onOpenReportModal}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1677C8] hover:bg-[#125ea0] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
          <span>Report Water Waste</span>
        </button>
      </div>
    </header>
  );
};
