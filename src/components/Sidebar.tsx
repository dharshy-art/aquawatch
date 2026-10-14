import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  AlertOctagon,
  Users,
  Lightbulb,
  ClipboardList,
  Award,
  Droplets,
  ExternalLink
} from 'lucide-react';

export type PageId =
  | 'overview'
  | 'analytics'
  | 'waste'
  | 'surveys'
  | 'recommendations'
  | 'inspections'
  | 'score';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  unresolvedWasteCount?: number;
  pendingActionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  unresolvedWasteCount = 0,
  pendingActionsCount = 0,
}) => {
  const navItems = [
    {
      id: 'overview' as PageId,
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'analytics' as PageId,
      label: 'Consumption Analytics',
      icon: BarChart3,
    },
    {
      id: 'waste' as PageId,
      label: 'Waste Detection & Leaks',
      icon: AlertOctagon,
      badge: unresolvedWasteCount > 0 ? unresolvedWasteCount : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'surveys' as PageId,
      label: 'Student Habits & Surveys',
      icon: Users,
    },
    {
      id: 'recommendations' as PageId,
      label: 'Conservation Actions',
      icon: Lightbulb,
      badge: pendingActionsCount > 0 ? pendingActionsCount : null,
      badgeColor: 'bg-blue-100 text-[#1677C8]',
    },
    {
      id: 'inspections' as PageId,
      label: 'Facility Inspections',
      icon: ClipboardList,
    },
    {
      id: 'score' as PageId,
      label: 'Conservation Score (0–100)',
      icon: Award,
    },
  ];

  return (
    <aside className="w-64 bg-[#12304A] text-slate-200 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#1677C8] flex items-center justify-center text-white shadow-sm">
          <Droplets className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight leading-none">
            AquaWatch
          </h1>
          <span className="text-[11px] text-slate-400 font-medium tracking-wide mt-1 block">
            Save Every Drop
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Monitoring & Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#1677C8] text-white shadow-2xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mission Footer Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#43A66B] block mb-1">
            Conservation Mission
          </span>
          <p className="text-xs text-slate-300 leading-snug">
            “Save Water Today. Secure Tomorrow.”
          </p>
          <div className="mt-2 pt-2 border-t border-slate-700/40 text-[11px] text-slate-400 flex items-center justify-between">
            <span>AquaWatch v2.4</span>
            <span className="text-slate-400">SQLite persistence</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
